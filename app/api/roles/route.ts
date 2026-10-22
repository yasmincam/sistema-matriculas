import { NextResponse } from "next/server";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../lib/auth";
import { pool } from "../../../lib/db";

const esquemaRol = z.object({
  usuarioId: z.number().int().positive(),
  rol: z.enum(["ADMINISTRADOR", "ESTUDIANTE"]),
});

type Cuenta = {
  id: number;
  rol: "ADMINISTRADOR" | "ESTUDIANTE";
  activo: boolean;
};

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
        { mensaje: "Solo un administrador puede cambiar roles." },
        { status: 403 }
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

    const validacion = esquemaRol.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        { mensaje: "Selecciona una cuenta y un rol válido." },
        { status: 400 }
      );
    }

    const { usuarioId, rol } = validacion.data;
    const cliente = await pool.connect();

    try {
      await cliente.query("BEGIN");

      // Procesa los cambios de roles de uno en uno.
      await cliente.query(
        "SELECT pg_advisory_xact_lock(81008)"
      );

      // Comprueba nuevamente los permisos dentro de la transacción.
      const administrador = await cliente.query(
        `SELECT id
         FROM usuarios
         WHERE id = $1
           AND rol = 'ADMINISTRADOR'
           AND activo = TRUE`,
        [usuario.id]
      );

      if (administrador.rows.length === 0) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "Tu cuenta ya no tiene permisos de administrador." },
          { status: 403 }
        );
      }

      const resultado = await cliente.query<Cuenta>(
        `SELECT id, rol, activo
         FROM usuarios
         WHERE id = $1
         FOR UPDATE`,
        [usuarioId]
      );

      const cuenta = resultado.rows[0];

      if (!cuenta) {
        await cliente.query("ROLLBACK");

        return NextResponse.json(
          { mensaje: "La cuenta no existe." },
          { status: 404 }
        );
      }

      if (cuenta.rol === rol) {
        await cliente.query("COMMIT");

        return NextResponse.json({
          mensaje: "La cuenta ya tiene ese rol.",
          cerrarSesion: false,
        });
      }

      if (
        cuenta.activo &&
        cuenta.rol === "ADMINISTRADOR" &&
        rol === "ESTUDIANTE"
      ) {
        const conteo = await cliente.query<{ total: number }>(
          `SELECT COUNT(*)::INTEGER AS total
           FROM usuarios
           WHERE rol = 'ADMINISTRADOR'
             AND activo = TRUE`
        );

        if (conteo.rows[0].total <= 1) {
          await cliente.query("ROLLBACK");

          return NextResponse.json(
            {
              mensaje:
                "No puedes cambiar el rol del último administrador " +
                "activo. Primero asigna otro administrador activo.",
            },
            { status: 409 }
          );
        }
      }

      await cliente.query(
        `UPDATE usuarios
         SET rol = $1
         WHERE id = $2`,
        [rol, usuarioId]
      );

      // Obliga a iniciar sesión otra vez con el nuevo rol.
      await cliente.query(
        "DELETE FROM sesiones WHERE usuario_id = $1",
        [usuarioId]
      );

      await cliente.query("COMMIT");

      const cerrarSesion = usuarioId === usuario.id;

      const respuesta = NextResponse.json({
        mensaje:
          "Rol actualizado correctamente. La cuenta deberá " +
          "volver a iniciar sesión.",
        cerrarSesion,
      });

      if (cerrarSesion) {
        respuesta.cookies.set("sesion", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      }

      respuesta.headers.set("Cache-Control", "no-store");

      return respuesta;
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  } catch {
    console.error("No se pudo cambiar el rol.");

    return NextResponse.json(
      { mensaje: "No se pudo actualizar el rol. Intenta nuevamente." },
      { status: 500 }
    );
  }
}