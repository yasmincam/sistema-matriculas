import { NextResponse } from "next/server";
import { pool } from "../../lib/db";

export async function GET() {
  try {
    const resultado = await pool.query(
      "SELECT current_database() AS base, NOW() AS fecha"
    );

    return NextResponse.json({
      mensaje: "Conexión exitosa con PostgreSQL",
      datos: resultado.rows[0],
    });
  } catch (error) {
    console.error("Error de conexión:", error);

    return NextResponse.json(
      { mensaje: "No se pudo conectar con PostgreSQL" },
      { status: 500 }
    );
  }
}