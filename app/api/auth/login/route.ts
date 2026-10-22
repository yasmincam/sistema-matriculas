import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../../../../lib/db";

const loginSchema = z.object({
  correo: z.string().trim().email().max(150),
  password: z
    .string()
    .min(8)
    .refine(
      (valor) => Buffer.byteLength(valor, "utf8") <= 72,
      "La contraseña es demasiado larga."
    ),
});

type UsuarioLogin = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  password_hash: string;
  rol: string;
  activo: boolean;
};

export async function POST(request: Request) {
  const origen = request.headers.get("origin");

  if (origen && origen !== new URL(request.url).origin) {
    return NextResponse.json(
      { mensaje: "Origen de solicitud no permitido." },
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

  const validacion = loginSchema.safeParse(body);

  if (!validacion.success) {
    return NextResponse.json(
      { mensaje: "Ingresa un correo y una contraseña válidos." },
      { status: 400 }
    );
  }

  const { correo, password } = validacion.data;

  try {
    const resultado = await pool.query<UsuarioLogin>(
      `SELECT
        id,
        nombres,
        apellidos,
        correo,
        password_hash,
        rol,
        activo
       FROM usuarios
       WHERE LOWER(correo) = $1`,
      [correo.toLowerCase()]
    );

    const usuario = resultado.rows[0];

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { mensaje: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const passwordCorrecto = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordCorrecto) {
      return NextResponse.json(
        { mensaje: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    // El navegador recibe el token original.
    const token = randomBytes(32).toString("hex");

    // En la base de datos guardamos únicamente su hash.
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    await pool.query(
      `INSERT INTO sesiones (
        token_hash,
        usuario_id,
        expira_en
       )
       VALUES ($1, $2, NOW() + INTERVAL '8 hours')`,
      [tokenHash, usuario.id]
    );

    const respuesta = NextResponse.json({
      mensaje: "Inicio de sesión correcto.",
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });

    respuesta.cookies.set("sesion", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    respuesta.headers.set("Cache-Control", "no-store");

    return respuesta;
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "DESCONOCIDO";

    console.error("Error al iniciar sesión. Código:", codigo);

    return NextResponse.json(
      { mensaje: "Ocurrió un error al iniciar sesión." },
      { status: 500 }
    );
  }
}