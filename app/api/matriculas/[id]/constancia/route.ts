import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { obtenerUsuarioActual } from "../../../../../lib/auth";
import { pool } from "../../../../../lib/db";

type Contexto = {
  params: Promise<{ id: string }>;
};

type Constancia = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  curso: string;
  docente: string;
  horario: string;
  modalidad: string;
  duracion_horas: number;
  estado: string;
  fecha_matricula: Date | string;
};

export async function GET(
  _request: Request,
  { params }: Contexto
) {
  try {
    const usuario = await obtenerUsuarioActual();

    if (!usuario) {
      return NextResponse.json(
        { mensaje: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const matriculaId = Number(id);

    if (
      !/^[0-9]+$/.test(id) ||
      !Number.isInteger(matriculaId) ||
      matriculaId < 1 ||
      matriculaId > 2147483647
    ) {
      return NextResponse.json(
        { mensaje: "Matrícula inválida." },
        { status: 400 }
      );
    }

    const esAdministrador = usuario.rol === "ADMINISTRADOR";

    const resultado = await pool.query<Constancia>(
      `SELECT
        m.id,
        u.nombres,
        u.apellidos,
        u.dni,
        c.nombre AS curso,
        c.docente,
        c.horario,
        c.modalidad,
        c.duracion_horas,
        m.estado,
        m.fecha_matricula
       FROM matriculas m
       INNER JOIN usuarios u ON u.id = m.estudiante_id
       INNER JOIN cursos c ON c.id = m.curso_id
       WHERE m.id = $1
         AND ($2::BOOLEAN = TRUE OR m.estudiante_id = $3)`,
      [matriculaId, esAdministrador, usuario.id]
    );

    const matricula = resultado.rows[0];

    if (!matricula) {
      return NextResponse.json(
        { mensaje: "Matrícula no encontrada." },
        { status: 404 }
      );
    }

    if (matricula.estado !== "ACTIVA") {
      return NextResponse.json(
        {
          mensaje:
            "No se emiten constancias para matrículas canceladas.",
        },
        { status: 409 }
      );
    }

    const fecha = new Intl.DateTimeFormat("es-PE", {
      dateStyle: "long",
      timeZone: "America/Lima",
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.setProperties({
      title: `Constancia de matrícula ${matricula.id}`,
      subject: "Constancia de inscripción a un curso",
      creator: "Sistema de matrículas",
    });

    pdf.setFillColor(109, 40, 217);
    pdf.rect(0, 0, 210, 45, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    pdf.text("CONSTANCIA DE MATRÍCULA", 20, 24);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text("Sistema de matrículas a cursos", 20, 34);

    pdf.setTextColor(30, 41, 59);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    pdf.text(
      `Matrícula N.º ${String(matricula.id).padStart(6, "0")}`,
      20,
      60
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    pdf.text(
      "Se deja constancia de la inscripción del estudiante:",
      20,
      73
    );

    let y = 86;

    function campo(etiqueta: string, valor: string) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(9);
      pdf.text(etiqueta, 20, y);

      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(11);

      const lineas = pdf.splitTextToSize(valor, 170) as string[];
      pdf.text(lineas, 20, y);

      y += lineas.length * 5 + 8;
    }

    campo(
      "ESTUDIANTE",
      `${matricula.nombres} ${matricula.apellidos}`
    );

    campo("DNI", matricula.dni);
    campo("CURSO", matricula.curso);
    campo("DOCENTE", matricula.docente);
    campo("HORARIO", matricula.horario);

    campo(
      "MODALIDAD Y DURACIÓN",
      `${matricula.modalidad} - ${matricula.duracion_horas} horas`
    );

    campo(
      "FECHA DE MATRÍCULA",
      fecha.format(new Date(matricula.fecha_matricula))
    );

    // Si los textos son extensos, el cierre pasa a otra página.
    if (y > 245) {
      pdf.addPage();
      y = 25;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(21, 128, 61);
    pdf.text("Estado al emitir: ACTIVA", 20, y);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);

    pdf.text(
      `Fecha de emisión: ${fecha.format(new Date())}`,
      20,
      y + 12
    );

    pdf.text(
      "Documento generado con la información vigente del curso.",
      20,
      y + 22
    );

    const paginas = pdf.getNumberOfPages();

    for (let pagina = 1; pagina <= paginas; pagina++) {
      pdf.setPage(pagina);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Sistema de matrículas | Página ${pagina} de ${paginas}`,
        20,
        285
      );
    }

    const archivo = pdf.output("arraybuffer");

    return new Response(archivo, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="constancia-${matricula.id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("No se pudo generar la constancia.");

    return NextResponse.json(
      { mensaje: "No se pudo generar la constancia." },
      { status: 500 }
    );
  }
}