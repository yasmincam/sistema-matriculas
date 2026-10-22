import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { pool } from "../../../../lib/db";

export async function POST(request: NextRequest) {
  const origen = request.headers.get("origin");

  if (origen && origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { mensaje: "Origen no permitido." },
      { status: 403 }
    );
  }

  try {
    const token = request.cookies.get("sesion")?.value;

    if (token) {
      const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

      await pool.query(
        "DELETE FROM sesiones WHERE token_hash = $1",
        [tokenHash]
      );
    }

    const respuesta = NextResponse.json({
      mensaje: "Sesión cerrada correctamente.",
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
    return NextResponse.json(
      { mensaje: "No se pudo cerrar la sesión. Intenta nuevamente." },
      { status: 500 }
    );
  }
}