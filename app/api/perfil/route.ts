import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../lib/auth";
import { pool } from "../../../lib/db";

const perfilSchema = z.object({
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { mensaje: "La solicitud no contiene un JSON válido." },
        { status: 400 }
      );
    }

    const validacion = perfilSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        {
          mensaje:
            "Los nombres y apellidos son obligatorios y deben " +
            "tener un máximo de 100 caracteres cada uno.",
        },
        { status: 400 }
      );
    }

    const { nombres, apellidos } = validacion.data;

    // El ID proviene de la sesión, nunca del formulario.
    const resultado = await pool.query(
      `UPDATE usuarios
       SET nombres = $1,
           apellidos = $2
       WHERE id = $3
         AND activo = TRUE
       RETURNING id, nombres, apellidos`,
      [nombres, apellidos, usuario.id]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { mensaje: "Tu cuenta ya no está disponible." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        mensaje: "Perfil actualizado correctamente.",
        usuario: resultado.rows[0],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    console.error("No se pudo actualizar el perfil.");

    return NextResponse.json(
      { mensaje: "No se pudo guardar el perfil. Intenta nuevamente." },
      { status: 500 }
    );
  }
}