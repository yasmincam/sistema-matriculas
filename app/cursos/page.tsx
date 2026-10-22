import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import BotonMatricula from "../../components/BotonMatricula";
import BotonPublicarCurso from "../../components/BotonPublicarCurso";
import { obtenerUsuarioActual } from "../../lib/auth";
import MenuNavegacion from "../../components/MenuNavegacion";
import { pool } from "../../lib/db";

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
  inscritos: number;
  matriculado: boolean;
};

type Props = {
  searchParams: Promise<{
    buscar?: string | string[];
    categoria?: string | string[];
  }>;
};

async function ListaCursos({ searchParams }: Props) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  const esAdministrador = usuario.rol === "ADMINISTRADOR";
  const parametros = await searchParams;

const buscar =
  typeof parametros.buscar === "string"
    ? parametros.buscar.trim().slice(0, 150)
    : "";

const categoria =
  typeof parametros.categoria === "string"
    ? parametros.categoria.trim().slice(0, 80)
    : "";

const categoriasResultado = await pool.query<{ categoria: string }>(
  `SELECT DISTINCT categoria
   FROM cursos
   WHERE ($1::BOOLEAN = TRUE OR publicado = TRUE)
   ORDER BY categoria`,
  [esAdministrador]
);

  const resultado = await pool.query<Curso>(
  `SELECT
    c.id,
    c.nombre,
    c.descripcion,
    c.categoria,
    c.docente,
    c.modalidad,
    c.horario,
    c.duracion_horas,
    c.capacidad,
    c.publicado,
    (
      SELECT COUNT(*)::INTEGER
      FROM matriculas m
      WHERE m.curso_id = c.id
        AND m.estado = 'ACTIVA'
    ) AS inscritos,
    EXISTS (
      SELECT 1
      FROM matriculas propia
      WHERE propia.curso_id = c.id
        AND propia.estudiante_id = $2
        AND propia.estado = 'ACTIVA'
    ) AS matriculado
   FROM cursos c
   WHERE ($1::BOOLEAN = TRUE OR c.publicado = TRUE)
     AND (
       $3::TEXT = ''
       OR STRPOS(LOWER(c.nombre), LOWER($3)) > 0
       OR STRPOS(LOWER(c.docente), LOWER($3)) > 0
     )
     AND ($4::TEXT = '' OR c.categoria = $4)
   ORDER BY c.creado_en DESC, c.id DESC`,
  [esAdministrador, usuario.id, buscar, categoria]
);

  const cursos = resultado.rows;

  return (
  <main className="min-h-screen bg-slate-100 px-4 py-10">
    <MenuNavegacion rol={usuario.rol} />

      <section className="mx-auto max-w-6xl">
        <Link
          href="/panel"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver al panel
        </Link>

        <header className="mb-8 mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {esAdministrador
                ? "Gestión de cursos"
                : "Cursos disponibles"}
            </h1>

            <p className="mt-2 text-slate-600">
              {esAdministrador
                ? "Consulta tus cursos publicados y borradores."
                : "Encuentra el próximo curso que quieres estudiar."}
            </p>
          </div>

          {esAdministrador && (
            <Link
              href="/cursos/nuevo"
              className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
            >
              + Crear curso
            </Link>
          )}
        </header>
        <form
  action="/cursos"
  method="GET"
  className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl bg-white p-5 shadow-sm"
>
  <label className="min-w-0 flex-1 text-sm font-medium text-slate-700">
    Buscar curso o docente
    <input
      key={buscar}
      name="buscar"
      type="search"
      defaultValue={buscar}
      maxLength={150}
      placeholder="Escribe un nombre..."
      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
    />
  </label>

  <label className="text-sm font-medium text-slate-700">
    Categoría
    <select
      key={categoria}
      name="categoria"
      defaultValue={categoria}
      className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
    >
      <option value="">Todas las categorías</option>

      {categoriasResultado.rows.map((opcion) => (
        <option key={opcion.categoria} value={opcion.categoria}>
          {opcion.categoria}
        </option>
      ))}
    </select>
  </label>

  <button
    type="submit"
    className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
  >
    Buscar
  </button>

  <Link
    href="/cursos"
    className="rounded-xl border border-slate-300 px-5 py-3 text-slate-700 hover:bg-slate-50"
  >
    Limpiar
  </Link>
</form>

        <p className="mb-5 text-sm text-slate-600">
          {cursos.length}{" "}
          {cursos.length === 1 ? "curso encontrado" : "cursos encontrados"}
        </p>

        {cursos.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Aún no hay cursos para mostrar
            </h2>

            <p className="mt-3 text-slate-600">
              {buscar || categoria
                ? "No hay coincidencias. Prueba otra búsqueda o pulsa Limpiar."
                : esAdministrador
                  ? "Pulsa Crear curso para registrar el primero."
                  : "Los cursos aparecerán cuando el administrador los publique."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cursos.map((curso) => {
              const cuposDisponibles = Math.max(
                0,
                curso.capacidad - curso.inscritos
              );

              return (
                <article
                  key={curso.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 bg-violet-100 px-6 py-4">
                    <span className="text-sm font-semibold text-violet-800">
                      {curso.categoria}
                    </span>

                    {esAdministrador && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          curso.publicado
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {curso.publicado ? "Publicado" : "Borrador"}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {curso.nombre}
                    </h2>

                    <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
                      {curso.descripcion || "Sin descripción."}
                    </p>

                    <dl className="mt-5 space-y-3 text-sm">
                      <div>
                        <dt className="text-slate-500">Docente</dt>
                        <dd className="font-medium text-slate-900">
                          {curso.docente}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-slate-500">Horario</dt>
                        <dd className="font-medium text-slate-900">
                          {curso.horario}
                        </dd>
                      </div>

                      <div className="flex justify-between gap-4">
                        <div>
                          <dt className="text-slate-500">Modalidad</dt>
                          <dd className="font-medium text-slate-900">
                            {curso.modalidad}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-slate-500">Duración</dt>
                          <dd className="font-medium text-slate-900">
                            {curso.duracion_horas} horas
                          </dd>
                        </div>
                      </div>
                    </dl>

                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <p className="text-sm text-slate-500">
                        {curso.inscritos} de {curso.capacidad} inscritos
                      </p>

                      <p
                        className={`mt-2 font-semibold ${
                          cuposDisponibles > 0
                            ? "text-green-700"
                            : "text-red-600"
                        }`}
                      >
                        {cuposDisponibles > 0
                          ? `${cuposDisponibles} cupos disponibles`
                          : "Sin cupos disponibles"}
                      </p>
                      {!esAdministrador && (
                        curso.matriculado ? (
                          <div className="mt-5 rounded-xl bg-green-50 p-4">
                            <p className="text-sm font-semibold text-green-800">
                              Ya estás matriculado
                            </p>

                            <Link
                              href="/matriculas"
                              className="mt-2 inline-block text-sm font-semibold text-violet-700 hover:underline"
                        >
                           Ver mis matrículas →
                            </Link>
                         </div>
                      ) : (
                        <BotonMatricula
                          cursoId={curso.id}
                          nombreCurso={curso.nombre}
                          sinCupos={cuposDisponibles === 0}
                        />
                      )
                    )}

                      {esAdministrador && (
                        <div className="mt-5">
                          <Link
                            href={`/cursos/${curso.id}/editar`}
                            className="block rounded-xl border border-violet-200 px-4 py-3 text-center text-sm font-semibold text-violet-700 hover:bg-violet-50"
                      >
                        Editar curso
                      </Link>

                      <BotonPublicarCurso
                        cursoId={curso.id}
                        publicado={curso.publicado}
                        />
                      </div>
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function CursosPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando cursos...
        </main>
      }
    >
      <ListaCursos searchParams={searchParams} />
    </Suspense>
  );
}