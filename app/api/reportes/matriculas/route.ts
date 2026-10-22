import { NextResponse } from "next/server";
import { obtenerUsuarioActual } from "../../../../lib/auth";
import { pool } from "../../../../lib/db";

type FilaReporte = {
  id: number;
  estudiante: string;
  curso: string;
  estado: string;
  fecha_matricula: Date | string;
  registrado_por: string;
  fecha_cancelacion: Date | string | null;
  motivo_cancelacion: string | null;
};

function celdaCSV(valor: unknown): string {
  let texto = String(valor ?? "");

  // Evita que Excel interprete estos valores como fórmulas.
  if (/^\s*[=+\-@]/.test(texto) || /^[\t\r\n]/.test(texto)) {
    texto = "'" + texto;
  }

  return `"${texto.replace(/"/g, '""')}"`;
}

const formatoFecha = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Lima",
});

function fechaReporte(fecha: Date | string | null): string {
  return fecha ? formatoFecha.format(new Date(fecha)) : "";
}

export async function GET(request: Request) {
  // Fuera del try para permitir que Next.js gestione
  // el acceso a la sesión durante el prerenderizado.
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return NextResponse.json(
      { mensaje: "Debes iniciar sesión." },
      { status: 401 }
    );
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    return NextResponse.json(
      { mensaje: "No tienes permiso para descargar este reporte." },
      { status: 403 }
    );
  }

  try {
    const parametros = new URL(request.url).searchParams;

    const buscar = (parametros.get("buscar") ?? "")
      .trim()
      .slice(0, 150);

    const estadoRecibido = parametros.get("estado");

    const estado =
      estadoRecibido === "ACTIVA" || estadoRecibido === "CANCELADA"
        ? estadoRecibido
        : "";

    const resultado = await pool.query<FilaReporte>(
      `SELECT
        m.id,
        CONCAT(u.nombres, ' ', u.apellidos) AS estudiante,
        c.nombre AS curso,
        m.estado,
        m.fecha_matricula,
        CONCAT(r.nombres, ' ', r.apellidos) AS registrado_por,
        m.fecha_cancelacion,
        m.motivo_cancelacion
       FROM matriculas m
       INNER JOIN usuarios u ON u.id = m.estudiante_id
       INNER JOIN cursos c ON c.id = m.curso_id
       INNER JOIN usuarios r ON r.id = m.registrado_por
       WHERE (
         $1::TEXT = ''
         OR STRPOS(LOWER(c.nombre), LOWER($1)) > 0
         OR STRPOS(
           LOWER(CONCAT(u.nombres, ' ', u.apellidos)),
           LOWER($1)
         ) > 0
       )
         AND ($2::TEXT = '' OR m.estado = $2)
       ORDER BY m.fecha_matricula DESC, m.id DESC`,
      [buscar, estado]
    );

    const encabezados = [
      "ID",
      "Estudiante",
      "Curso",
      "Estado",
      "Fecha de matrícula (Perú)",
      "Registrada por",
      "Fecha de cancelación (Perú)",
      "Motivo de cancelación",
    ];

    const filas = resultado.rows.map((fila) => [
      fila.id,
      fila.estudiante,
      fila.curso,
      fila.estado,
      fechaReporte(fila.fecha_matricula),
      fila.registrado_por,
      fechaReporte(fila.fecha_cancelacion),
      fila.motivo_cancelacion,
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) => fila.map(celdaCSV).join(";"))
      .join("\r\n");

    return new Response("\uFEFF" + contenido, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="reporte-matriculas.csv"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("No se pudo generar el reporte de matrículas.");

    return NextResponse.json(
      { mensaje: "No se pudo generar el reporte." },
      { status: 500 }
    );
  }
}