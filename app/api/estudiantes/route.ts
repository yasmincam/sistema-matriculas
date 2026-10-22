import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../lib/auth";
import { pool } from "../../../lib/db";

const estadoSchema = z.object({
  estudianteId: z.number().int().positive(),
  activo: z.boolean(),
});

export async function PATCH(request: Request) {
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

    if (usuario.rol !== "ADMINISTRADOR") {
      return NextResponse.json(
        { mensaje: "Solo el administrador puede cambiar el estado." },
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

    const validacion = estadoSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { mensaje: "Los datos enviados no son válidos." },
        { status: 400 }
      );
    }

    const { estudianteId, activo } = validacion.data;
    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");

      const resultado = await cliente.query(
        `UPDATE usuarios
         SET activo = $1
         WHERE id = $2
           AND rol = 'ESTUDIANTE'
         RETURNING id, activo`,
        [activo, estudianteId]
      );

      if (resultado.rows.length === 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "El estudiante no existe." },
          { status: 404 }
        );
      }

      // Al desactivarlo, invalida todas sus sesiones existentes.
      if (!activo) {
        await cliente.query(
          "DELETE FROM sesiones WHERE usuario_id = $1",
          [estudianteId]
        );
      }

      await cliente.query("COMMIT");

      return NextResponse.json({
        mensaje: activo
          ? "Estudiante activado correctamente."
          : "Estudiante desactivado correctamente.",
      });
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  } catch {
    console.error("No se pudo cambiar el estado del estudiante.");

    return NextResponse.json(
      { mensaje: "No se pudo actualizar el estudiante." },
      { status: 500 }
    );
  }
}