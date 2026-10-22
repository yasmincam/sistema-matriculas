import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { obtenerUsuarioActual } from "../../../../lib/auth";
import { pool } from "../../../../lib/db";

const registroSchema = z.object({
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  dni: z.string().trim().regex(/^\d{8}$/),
  correo: z.string().trim().email().max(150),
  password: z
    .string()
    .min(8)
    .refine(
      (valor) => Buffer.byteLength(valor, "utf8") <= 72,
      "La contraseña es demasiado larga."
    ),
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
    const usuarioActual = await obtenerUsuarioActual();

    if (!usuarioActual) {
      return NextResponse.json(
        { mensaje: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    if (usuarioActual.rol !== "ADMINISTRADOR") {
      return NextResponse.json(
        {
          mensaje:
            "Solo el administrador puede registrar estudiantes desde esta opción.",
        },
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

    const validacion = registroSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        {
          mensaje:
            "Revisa los datos: nombres y apellidos obligatorios, " +
            "DNI de 8 dígitos, correo válido y contraseña de al menos " +
            "8 caracteres y un máximo de 72 bytes.",
        },
        { status: 400 }
      );
    }

    const { nombres, apellidos, dni, correo, password } =
      validacion.data;

    const passwordHash = await bcrypt.hash(password, 12);

    const resultado = await pool.query(
      `INSERT INTO usuarios (
        nombres,
        apellidos,
        dni,
        correo,
        password_hash,
        rol,
        activo
      )
      VALUES ($1, $2, $3, $4, $5, 'ESTUDIANTE', TRUE)
      RETURNING
        id,
        nombres,
        apellidos,
        dni,
        correo,
        rol,
        activo`,
      [
        nombres,
        apellidos,
        dni,
        correo.toLowerCase(),
        passwordHash,
      ]
    );

    return NextResponse.json(
      {
        mensaje: "Estudiante registrado correctamente.",
        estudiante: resultado.rows[0],
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const codigo =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(error.code)
        : "";

    if (codigo === "23505") {
      return NextResponse.json(
        { mensaje: "El DNI o correo ya está registrado." },
        { status: 409 }
      );
    }

    console.error(
      "No se pudo registrar al estudiante. Código:",
      codigo
    );

    return NextResponse.json(
      { mensaje: "No se pudo registrar al estudiante." },
      { status: 500 }
    );
  }
}