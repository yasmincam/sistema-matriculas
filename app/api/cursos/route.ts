import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../lib/auth";
import { pool } from "../../../lib/db";

const horaSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "La hora debe tener el formato HH:mm."
  );

const horarioSchema = z.object({
  dia_semana: z.number().int().min(1).max(7),
  hora_inicio: horaSchema,
  hora_fin: horaSchema,
});

const horariosSchema = z
  .array(horarioSchema)
  .min(1, "Agrega al menos un horario.")
  .max(28, "Puedes registrar hasta 28 bloques por curso.")
  .superRefine((horarios, contexto) => {
    for (let i = 0; i < horarios.length; i++) {
      const actual = horarios[i];

      if (actual.hora_fin <= actual.hora_inicio) {
        contexto.addIssue({
          code: "custom",
          path: [i, "hora_fin"],
          message:
            `En el bloque ${i + 1}, la hora de fin debe ser ` +
            "posterior a la hora de inicio.",
        });
      }

      for (let j = 0; j < i; j++) {
        const anterior = horarios[j];

        const seCruzan =
          actual.dia_semana === anterior.dia_semana &&
          actual.hora_inicio < anterior.hora_fin &&
          actual.hora_fin > anterior.hora_inicio;

        if (seCruzan) {
          contexto.addIssue({
            code: "custom",
            path: [i],
            message:
              `Los bloques ${j + 1} y ${i + 1} ` +
              "tienen un cruce de horario.",
          });
        }
      }
    }
  });

const cursoSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().max(3000),
  categoria: z.string().trim().min(1).max(80),
  docente: z.string().trim().min(1).max(150),
  modalidad: z.enum(["VIRTUAL", "PRESENCIAL", "HIBRIDA"]),
  horarios: horariosSchema,
  duracion_horas: z.number().int().min(1).max(1000),
  capacidad: z.number().int().min(1).max(500),
  publicado: z.boolean(),
});

const editarSchema = cursoSchema.extend({
  cursoId: z.number().int().positive(),
});

const publicacionSchema = z.object({
  cursoId: z.number().int().positive(),
  publicado: z.boolean(),
});

type Horario = z.infer<typeof horarioSchema>;

const dias = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function ordenarHorarios(horarios: Horario[]): Horario[] {
  return [...horarios].sort(
    (a, b) =>
      a.dia_semana - b.dia_semana ||
      a.hora_inicio.localeCompare(b.hora_inicio)
  );
}

function crearResumen(horarios: Horario[]): string {
  return horarios
    .map(
      (horario) =>
        `${dias[horario.dia_semana]} ` +
        `${horario.hora_inicio}-${horario.hora_fin}`
    )
    .join("; ");
}

async function comprobarPermisos(
  request: Request
): Promise<NextResponse | null> {
  const origen = request.headers.get("origin");

  if (origen && origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { mensaje: "Origen no permitido." },
      { status: 403 }
    );
  }

  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return NextResponse.json(
      { mensaje: "Debes iniciar sesión." },
      { status: 401 }
    );
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    return NextResponse.json(
      { mensaje: "Solo el administrador puede gestionar cursos." },
      { status: 403 }
    );
  }

  return null;
}

async function guardarCurso(
  request: Request,
  editando: boolean
) {
  try {
    const errorPermisos = await comprobarPermisos(request);

    if (errorPermisos) {
      return errorPermisos;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { mensaje: "La solicitud no contiene un JSON válido." },
        { status: 400 }
      );
    }

    const validacion = editarSchema.safeParse(
      editando
        ? body
        : typeof body === "object" &&
            body !== null &&
            !Array.isArray(body)
          ? { ...body, cursoId: 1 }
          : body
    );

    if (!validacion.success) {
      return NextResponse.json(
        {
          mensaje:
            validacion.error.issues[0]?.message ??
            "Revisa los datos del curso y sus horarios.",
        },
        { status: 400 }
      );
    }

    const curso = validacion.data;
    const horarios = ordenarHorarios(curso.horarios);
    const resumen = crearResumen(horarios);

    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");
      // Coordina los cambios de horarios con las matrículas.
      await cliente.query(
      "SELECT pg_advisory_xact_lock(81020)"
      );

      if (editando) {
        // Usa el mismo bloqueo del curso que las matrículas.
        const existente = await cliente.query(
          `SELECT id
           FROM cursos
           WHERE id = $1
           FOR UPDATE`,
          [curso.cursoId]
        );

        if (existente.rows.length === 0) {
          await cliente.query("ROLLBACK");

          return NextResponse.json(
            { mensaje: "El curso no existe." },
            { status: 404 }
          );
        }

        const conteo = await cliente.query<{
          inscritos: number;
        }>(
          `SELECT COUNT(*)::INTEGER AS inscritos
           FROM matriculas
           WHERE curso_id = $1
             AND estado = 'ACTIVA'`,
          [curso.cursoId]
        );

        if (curso.capacidad < conteo.rows[0].inscritos) {
          await cliente.query("ROLLBACK");

          return NextResponse.json(
            {
              mensaje:
                `El curso tiene ${conteo.rows[0].inscritos} ` +
                "estudiantes matriculados. La capacidad no puede " +
                "ser menor que esa cantidad.",
            },
            { status: 409 }
          );
        }
      }
      if (editando) {
  const resultadoCruce = await cliente.query<{
    curso: string;
    dia_semana: number;
    inicio_nuevo: string;
    fin_nuevo: string;
    inicio_existente: string;
    fin_existente: string;
  }>(
    `SELECT
       otro_curso.nombre AS curso,
       nuevo.dia_semana,
       TO_CHAR(nuevo.hora_inicio, 'HH24:MI')
         AS inicio_nuevo,
       TO_CHAR(nuevo.hora_fin, 'HH24:MI')
         AS fin_nuevo,
       TO_CHAR(existente.hora_inicio, 'HH24:MI')
         AS inicio_existente,
       TO_CHAR(existente.hora_fin, 'HH24:MI')
         AS fin_existente
     FROM JSONB_TO_RECORDSET($2::JSONB) AS nuevo (
       dia_semana INTEGER,
       hora_inicio TIME,
       hora_fin TIME
     )
     INNER JOIN horarios_curso existente
       ON existente.dia_semana = nuevo.dia_semana
      AND nuevo.hora_inicio < existente.hora_fin
      AND nuevo.hora_fin > existente.hora_inicio
     INNER JOIN cursos otro_curso
       ON otro_curso.id = existente.curso_id
     WHERE existente.curso_id <> $1
       AND EXISTS (
         SELECT 1
         FROM matriculas propia
         INNER JOIN matriculas otra
           ON otra.estudiante_id = propia.estudiante_id
          AND otra.estado = 'ACTIVA'
          AND otra.curso_id = existente.curso_id
         WHERE propia.curso_id = $1
           AND propia.estado = 'ACTIVA'
       )
     ORDER BY
       nuevo.dia_semana,
       nuevo.hora_inicio,
       otro_curso.id
     LIMIT 1`,
    [curso.cursoId, JSON.stringify(horarios)]
  );

  const cruce = resultadoCruce.rows[0];

  if (cruce) {
    const nombresDias = [
      "",
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
      "domingo",
    ];

    await cliente.query("ROLLBACK");

    return NextResponse.json(
      {
        mensaje:
          "No se pueden guardar estos horarios porque un estudiante " +
          `matriculado también lleva "${cruce.curso}". ` +
          `Hay un cruce el ${nombresDias[cruce.dia_semana]}: ` +
          `el horario propuesto es ${cruce.inicio_nuevo}–` +
          `${cruce.fin_nuevo} y el otro curso tiene clases de ` +
          `${cruce.inicio_existente} a ${cruce.fin_existente}.`,
      },
      { status: 409 }
    );
  }
}

      const valores = [
        curso.nombre,
        curso.descripcion,
        curso.categoria,
        curso.docente,
        curso.modalidad,
        resumen,
        curso.duracion_horas,
        curso.capacidad,
        curso.publicado,
      ];

      const resultado = editando
        ? await cliente.query<{
            id: number;
            nombre: string;
            publicado: boolean;
          }>(
            `UPDATE cursos
             SET nombre = $1,
                 descripcion = $2,
                 categoria = $3,
                 docente = $4,
                 modalidad = $5,
                 horario = $6,
                 duracion_horas = $7,
                 capacidad = $8,
                 publicado = $9
             WHERE id = $10
             RETURNING id, nombre, publicado`,
            [...valores, curso.cursoId]
          )
        : await cliente.query<{
            id: number;
            nombre: string;
            publicado: boolean;
          }>(
            `INSERT INTO cursos (
              nombre,
              descripcion,
              categoria,
              docente,
              modalidad,
              horario,
              duracion_horas,
              capacidad,
              publicado
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, nombre, publicado`,
            valores
          );

      const guardado = resultado.rows[0];

      if (editando) {
        await cliente.query(
          "DELETE FROM horarios_curso WHERE curso_id = $1",
          [guardado.id]
        );
      }

      for (const horario of horarios) {
        await cliente.query(
          `INSERT INTO horarios_curso (
            curso_id,
            dia_semana,
            hora_inicio,
            hora_fin
          )
          VALUES ($1, $2, $3::TIME, $4::TIME)`,
          [
            guardado.id,
            horario.dia_semana,
            horario.hora_inicio,
            horario.hora_fin,
          ]
        );
      }

      await cliente.query("COMMIT");

      return NextResponse.json(
        {
          mensaje: editando
            ? "Curso y horarios actualizados correctamente."
            : "Curso y horarios creados correctamente.",
          curso: {
            ...guardado,
            horario: resumen,
            horarios,
          },
        },
        { status: editando ? 200 : 201 }
      );
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  } catch {
    console.error("No se pudo guardar el curso y sus horarios.");

    return NextResponse.json(
      {
        mensaje:
          "No se pudo guardar el curso y sus horarios. " +
          "Intenta nuevamente.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return guardarCurso(request, false);
}

export async function PUT(request: Request) {
  return guardarCurso(request, true);
}

export async function PATCH(request: Request) {
  try {
    const errorPermisos = await comprobarPermisos(request);

    if (errorPermisos) {
      return errorPermisos;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { mensaje: "La solicitud no contiene un JSON válido." },
        { status: 400 }
      );
    }

    const validacion = publicacionSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { mensaje: "Los datos enviados no son válidos." },
        { status: 400 }
      );
    }

    const { cursoId, publicado } = validacion.data;

    const resultado = await pool.query(
      `UPDATE cursos
       SET publicado = $1
       WHERE id = $2
       RETURNING id, nombre, publicado`,
      [publicado, cursoId]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { mensaje: "El curso no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mensaje: publicado
        ? "Curso publicado correctamente."
        : "Curso ocultado correctamente.",
      curso: resultado.rows[0],
    });
  } catch {
    console.error("No se pudo cambiar la publicación del curso.");

    return NextResponse.json(
      { mensaje: "No se pudo actualizar el curso." },
      { status: 500 }
    );
  }
}