import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../../../../lib/db";

const registroSchema = z.object({
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  dni: z.string().regex(/^\d{8}$/),
  correo: z.string().trim().email().max(150),
  password: z
    .string()
    .min(8)
    .refine(
      (valor) => Buffer.byteLength(valor, "utf8") <= 72,
      "La contraseña es demasiado larga"
    ),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { mensaje: "El cuerpo de la solicitud no es un JSON válido." },
      { status: 400 }
    );
  }

  const validacion = registroSchema.safeParse(body);

  if (!validacion.success) {
    return NextResponse.json(
      {
        mensaje:
          "Revisa tus datos: nombres y apellidos obligatorios, " +
          "DNI de 8 dígitos, correo válido y contraseña de al menos 8 caracteres.",
      },
      { status: 400 }
    );
  }

  const { nombres, apellidos, dni, correo, password } = validacion.data;

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const resultado = await pool.query(
      `INSERT INTO usuarios (
        nombres,
        apellidos,
        dni,
        correo,
        password_hash,
        rol
      )
      VALUES ($1, $2, $3, $4, $5, 'ESTUDIANTE')
      RETURNING id, nombres, apellidos, correo, rol`,
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
        usuario: resultado.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    const codigo =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (codigo === "23505") {
      return NextResponse.json(
        { mensaje: "El DNI o correo ya está registrado." },
        { status: 409 }
      );
    }

    // No mostramos contraseñas ni datos personales en el registro.
    console.error("Error al registrar estudiante. Código:", codigo);

    return NextResponse.json(
      { mensaje: "No se pudo registrar al estudiante." },
      { status: 500 }
    );
  }
}