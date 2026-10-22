import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../../lib/auth";
import { pool } from "../../../../lib/db";

const passwordSchema = z.object({
  actual: z
    .string()
    .min(1)
    .refine((valor) => Buffer.byteLength(valor, "utf8") <= 72),

  nueva: z
    .string()
    .min(8)
    .refine((valor) => Buffer.byteLength(valor, "utf8") <= 72),
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

    const validacion = passwordSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        {
          mensaje:
            "Completa la contraseña actual y usa una nueva de al menos " +
            "8 caracteres y como máximo 72 bytes.",
        },
        { status: 400 }
      );
    }

    const { actual, nueva } = validacion.data;

    if (actual === nueva) {
      return NextResponse.json(
        { mensaje: "La contraseña nueva debe ser diferente." },
        { status: 400 }
      );
    }

    const resultado = await pool.query<{
      password_hash: string;
    }>(
      `SELECT password_hash
       FROM usuarios
       WHERE id = $1 AND activo = TRUE`,
      [usuario.id]
    );

    const cuenta = resultado.rows[0];

    if (
      !cuenta ||
      !(await bcrypt.compare(actual, cuenta.password_hash))
    ) {
      return NextResponse.json(
        { mensaje: "La contraseña actual es incorrecta." },
        { status: 400 }
      );
    }

    const nuevoHash = await bcrypt.hash(nueva, 12);
    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");

      const actualizada = await cliente.query(
        `UPDATE usuarios
         SET password_hash = $1
         WHERE id = $2
           AND password_hash = $3
           AND activo = TRUE
         RETURNING id`,
        [nuevoHash, usuario.id, cuenta.password_hash]
      );

      if (actualizada.rows.length === 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "La cuenta cambió. Inicia sesión e intenta nuevamente." },
          { status: 409 }
        );
      }

      await cliente.query(
        "DELETE FROM sesiones WHERE usuario_id = $1",
        [usuario.id]
      );

      await cliente.query("COMMIT");
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }

    const respuesta = NextResponse.json({
      mensaje:
        "Contraseña actualizada. Inicia sesión con tu nueva contraseña.",
    });

    respuesta.cookies.set("sesion", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    respuesta.headers.set("Cache-Control", "no-store");

    return respuesta;
  } catch {
    console.error("No se pudo cambiar la contraseña.");

    return NextResponse.json(
      { mensaje: "No se pudo cambiar la contraseña." },
      { status: 500 }
    );
  }
}