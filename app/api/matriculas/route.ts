import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../lib/auth";
import { pool } from "../../../lib/db";

const matriculaSchema = z.object({
  cursoId: z.number().int().positive().max(2147483647),
  estudianteId: z
    .number()
    .int()
    .positive()
    .max(2147483647)
    .optional(),
});

const dias = [
  "",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

type CruceHorario = {
  curso: string;
  dia_semana: number;
  inicio_nuevo: string;
  fin_nuevo: string;
  inicio_existente: string;
  fin_existente: string;
};

export async function POST(request: Request) {
  const origen = request.headers.get("origin");

  if (origen && origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { mensaje: "Origen no permitido." },
      { status: 403 }
    );
  }

  try {
    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
      return NextResponse.json(
        { mensaje: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    if (
      usuario.rol !== "ADMINISTRADOR" &&
      usuario.rol !== "ESTUDIANTE"
    ) {
      return NextResponse.json(
        { mensaje: "Tu cuenta no tiene permiso para matricular." },
        { status: 403 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { mensaje: "Solicitud inválida." },
        { status: 400 }
      );
    }

    const validacion = matriculaSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { mensaje: "Selecciona un curso y estudiante válidos." },
        { status: 400 }
      );
    }

    const { cursoId, estudianteId: estudianteSeleccionado } =
      validacion.data;

    const esAdministrador = usuario.rol === "ADMINISTRADOR";

    if (esAdministrador && estudianteSeleccionado === undefined) {
      return NextResponse.json(
        { mensaje: "Debes seleccionar un estudiante." },
        { status: 400 }
      );
    }

    if (
      !esAdministrador &&
      estudianteSeleccionado !== undefined &&
      estudianteSeleccionado !== usuario.id
    ) {
      return NextResponse.json(
        { mensaje: "No puedes matricular a otra persona." },
        { status: 403 }
      );
    }

    const estudianteId = esAdministrador
      ? estudianteSeleccionado!
      : usuario.id;

    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");
      // Coordina las matrículas con los cambios de horarios.
      await cliente.query(
      "SELECT pg_advisory_xact_lock(81020)"
      );

      // Procesa las matrículas del mismo estudiante de una en una,
      // incluso cuando las solicitudes son para cursos distintos.
      await cliente.query(
        "SELECT pg_advisory_xact_lock(81019, $1::INTEGER)",
        [estudianteId]
      );

      const resultadoCurso = await cliente.query<{
        id: number;
        nombre: string;
        capacidad: number;
        publicado: boolean;
      }>(
        `SELECT id, nombre, capacidad, publicado
         FROM cursos
         WHERE id = $1
         FOR UPDATE`,
        [cursoId]
      );

      const curso = resultadoCurso.rows[0];

      if (!curso || !curso.publicado) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "El curso no está publicado o no existe." },
          { status: 404 }
        );
      }

      const resultadoEstudiante = await cliente.query(
        `SELECT id
         FROM usuarios
         WHERE id = $1
           AND rol = 'ESTUDIANTE'
           AND activo = TRUE
         FOR SHARE`,
        [estudianteId]
      );

      if (resultadoEstudiante.rows.length === 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "El estudiante no existe o no está activo." },
          { status: 400 }
        );
      }

      const duplicado = await cliente.query(
        `SELECT id
         FROM matriculas
         WHERE estudiante_id = $1
           AND curso_id = $2
           AND estado = 'ACTIVA'`,
        [estudianteId, cursoId]
      );

      if (duplicado.rows.length > 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          {
            mensaje:
              "El estudiante ya tiene una matrícula activa en este curso.",
          },
          { status: 409 }
        );
      }

      // El curso debe tener horarios estructurados.
      const horariosCurso = await cliente.query(
        `SELECT id
         FROM horarios_curso
         WHERE curso_id = $1
         LIMIT 1`,
        [cursoId]
      );

      if (horariosCurso.rows.length === 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          {
            mensaje:
              "Este curso todavía no tiene días y horas configurados. " +
              "El administrador debe registrar sus horarios.",
          },
          { status: 409 }
        );
      }

      // No permite comprobar parcialmente los horarios de cursos antiguos.
      const pendientes = await cliente.query<{ nombre: string }>(
        `SELECT c.nombre
         FROM matriculas m
         INNER JOIN cursos c ON c.id = m.curso_id
         WHERE m.estudiante_id = $1
           AND m.estado = 'ACTIVA'
           AND NOT EXISTS (
             SELECT 1
             FROM horarios_curso h
             WHERE h.curso_id = c.id
           )
         ORDER BY c.id
         LIMIT 1`,
        [estudianteId]
      );

      if (pendientes.rows.length > 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          {
            mensaje:
              `No se pueden comprobar los cruces porque el curso ` +
              `"${pendientes.rows[0].nombre}", en el que ya está ` +
              "matriculado el estudiante, no tiene horarios " +
              "estructurados. Solicita al administrador configurarlos.",
          },
          { status: 409 }
        );
      }

      const resultadoCruce = await cliente.query<CruceHorario>(
        `SELECT
           c.nombre AS curso,
           nuevo.dia_semana,
           TO_CHAR(nuevo.hora_inicio, 'HH24:MI') AS inicio_nuevo,
           TO_CHAR(nuevo.hora_fin, 'HH24:MI') AS fin_nuevo,
           TO_CHAR(existente.hora_inicio, 'HH24:MI')
             AS inicio_existente,
           TO_CHAR(existente.hora_fin, 'HH24:MI')
             AS fin_existente
         FROM horarios_curso nuevo
         INNER JOIN horarios_curso existente
           ON existente.dia_semana = nuevo.dia_semana
          AND nuevo.hora_inicio < existente.hora_fin
          AND nuevo.hora_fin > existente.hora_inicio
         INNER JOIN matriculas m
           ON m.curso_id = existente.curso_id
          AND m.estudiante_id = $2
          AND m.estado = 'ACTIVA'
         INNER JOIN cursos c
           ON c.id = existente.curso_id
         WHERE nuevo.curso_id = $1
         ORDER BY
           nuevo.dia_semana,
           nuevo.hora_inicio,
           c.id
         LIMIT 1`,
        [cursoId, estudianteId]
      );

      const cruce = resultadoCruce.rows[0];

      if (cruce) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          {
            mensaje:
              `No se puede registrar la matrícula: hay un cruce ` +
              `con "${cruce.curso}" el ${dias[cruce.dia_semana]}. ` +
              `El nuevo curso tiene clases de ${cruce.inicio_nuevo} ` +
              `a ${cruce.fin_nuevo} y el curso inscrito de ` +
              `${cruce.inicio_existente} a ${cruce.fin_existente}.`,
          },
          { status: 409 }
        );
      }

      const resultadoCupos = await cliente.query<{
        inscritos: number;
      }>(
        `SELECT COUNT(*)::INTEGER AS inscritos
         FROM matriculas
         WHERE curso_id = $1
           AND estado = 'ACTIVA'`,
        [cursoId]
      );

      if (resultadoCupos.rows[0].inscritos >= curso.capacidad) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "El curso ya no tiene cupos disponibles." },
          { status: 409 }
        );
      }

      const resultado = await cliente.query(
        `INSERT INTO matriculas (
           estudiante_id,
           curso_id,
           registrado_por
         )
         VALUES ($1, $2, $3)
         RETURNING id, estado, fecha_matricula`,
        [estudianteId, cursoId, usuario.id]
      );

      await cliente.query("COMMIT");

      return NextResponse.json(
        {
          mensaje:
            `Matrícula registrada correctamente en ${curso.nombre}.`,
          matricula: resultado.rows[0],
        },
        { status: 201 }
      );
    } catch (error) {
      await cliente.query("ROLLBACK");

      const codigo =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String(error.code)
          : "";

      if (codigo === "23505") {
        return NextResponse.json(
          { mensaje: "Ya existe una matrícula activa en este curso." },
          { status: 409 }
        );
      }

      throw error;
    } finally {
      cliente.release();
    }
  } catch {
    console.error("No se pudo registrar la matrícula.");

    return NextResponse.json(
      { mensaje: "No se pudo completar la matrícula." },
      { status: 500 }
    );
  }
}