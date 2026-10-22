import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../../lib/auth";
import { pool } from "../../../../lib/db";

const cancelarSchema = z.object({
  matriculaId: z.number().int().positive(),
  motivo: z.string().trim().min(5).max(500),
});

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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { mensaje: "Solicitud inválida." },
        { status: 400 }
      );
    }

    const validacion = cancelarSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { mensaje: "Ingresa un motivo de entre 5 y 500 caracteres." },
        { status: 400 }
      );
    }

    const { matriculaId, motivo } = validacion.data;
    const esAdministrador = usuario.rol === "ADMINISTRADOR";

    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");

      // Primero verifica que la matrícula pertenezca al usuario,
      // excepto cuando quien cancela es un administrador.
      const resultado = await cliente.query<{
        curso_id: number;
      }>(
        `SELECT curso_id
         FROM matriculas
         WHERE id = $1
           AND ($2::BOOLEAN = TRUE OR estudiante_id = $3)`,
        [matriculaId, esAdministrador, usuario.id]
      );

      const matricula = resultado.rows[0];

      if (!matricula) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "Matrícula no encontrada." },
          { status: 404 }
        );
      }

      // Usa el mismo orden de bloqueo que el registro:
      // primero el curso y después la matrícula.
      await cliente.query(
        "SELECT id FROM cursos WHERE id = $1 FOR UPDATE",
        [matricula.curso_id]
      );

      const actualizada = await cliente.query(
        `UPDATE matriculas
         SET estado = 'CANCELADA',
             cancelado_por = $1,
             fecha_cancelacion = NOW(),
             motivo_cancelacion = $2
         WHERE id = $3
           AND estado = 'ACTIVA'
           AND ($4::BOOLEAN = TRUE OR estudiante_id = $1)
         RETURNING id`,
        [
          usuario.id,
          motivo,
          matriculaId,
          esAdministrador,
        ]
      );

      if (actualizada.rows.length === 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "La matrícula ya no está activa." },
          { status: 409 }
        );
      }

      await cliente.query("COMMIT");

      return NextResponse.json({
        mensaje: "Matrícula cancelada. El cupo quedó disponible.",
      });
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  } catch {
    console.error("No se pudo cancelar la matrícula.");

    return NextResponse.json(
      { mensaje: "No se pudo cancelar la matrícula." },
      { status: 500 }
    );
  }
}