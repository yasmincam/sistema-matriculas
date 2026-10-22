import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../../../lib/auth";
import { pool } from "../../../../lib/db";
import FormularioCurso from "../../../../components/FormularioCurso";

type Props = {
  params: Promise<{ id: string }>;
};

type Curso = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  docente: string;
  modalidad: string;
  horario: string;
  duracion_horas: number;
  capacidad: number;
  publicado: boolean;
};

type Horario = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

async function ContenidoEditarCurso({ params }: Props) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    redirect("/panel");
  }

  const { id } = await params;
  const cursoId = Number(id);

  if (
    !/^[0-9]+$/.test(id) ||
    !Number.isInteger(cursoId) ||
    cursoId < 1 ||
    cursoId > 2147483647
  ) {
    notFound();
  }

  const resultado = await pool.query<Curso>(
    `SELECT
      id,
      nombre,
      descripcion,
      categoria,
      docente,
      modalidad,
      horario,
      duracion_horas,
      capacidad,
      publicado
     FROM cursos
     WHERE id = $1`,
    [cursoId]
  );

  const curso = resultado.rows[0];

  if (!curso) {
    notFound();
  }

  const resultadoHorarios = await pool.query<Horario>(
    `SELECT
      dia_semana,
      TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
      TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin
     FROM horarios_curso
     WHERE curso_id = $1
     ORDER BY dia_semana, hora_inicio, hora_fin`,
    [cursoId]
  );

  const cursoConHorarios = {
    ...curso,
    horarios: resultadoHorarios.rows,
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/cursos"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver a cursos
        </Link>

        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Editar curso
          </h1>

          <p className="mb-8 mt-2 text-slate-600">
            Actualiza la información, configura los días y horas
            de clase y guarda los cambios.
          </p>

          <FormularioCurso
            key={`${curso.id}-${JSON.stringify(cursoConHorarios)}`}
            curso={cursoConHorarios}
          />
        </div>
      </section>
    </main>
  );
}

export default function EditarCursoPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando curso...
        </main>
      }
    >
      <ContenidoEditarCurso params={params} />
    </Suspense>
  );
}