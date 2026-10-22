import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../lib/auth";
import MenuNavegacion from "../../components/MenuNavegacion";
import BotonCancelarMatricula from "../../components/BotonCancelarMatricula";
import { pool } from "../../lib/db";

type Matricula = {
  id: number;
  curso: string;
  docente: string;
  horario: string;
  modalidad: string;
  duracion_horas: number;
  estado: string;
  fecha_matricula: Date | string;
  nombres: string;
  apellidos: string;
  registrado_por_nombre: string;
  fecha_cancelacion: Date | string | null;
  motivo_cancelacion: string | null;
  cancelado_por_nombre: string | null;
};

type Props = {
  searchParams: Promise<{
    buscar?: string | string[];
    estado?: string | string[];
  }>;
};

async function ContenidoMatriculas({ searchParams }: Props) {
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

  const estado =
    parametros.estado === "ACTIVA" ||
    parametros.estado === "CANCELADA"
      ? parametros.estado
      : "";

  const resultado = await pool.query<Matricula>(
    `SELECT
      m.id,
      c.nombre AS curso,
      c.docente,
      c.horario,
      c.modalidad,
      c.duracion_horas,
      m.estado,
      m.fecha_matricula,
      m.fecha_cancelacion,
      m.motivo_cancelacion,
      u.nombres,
      u.apellidos,
      CONCAT(r.nombres, ' ', r.apellidos)
        AS registrado_por_nombre,
      NULLIF(
        CONCAT_WS(' ', cancelador.nombres, cancelador.apellidos),
        ''
      ) AS cancelado_por_nombre
     FROM matriculas m
     INNER JOIN cursos c ON c.id = m.curso_id
     INNER JOIN usuarios u ON u.id = m.estudiante_id
     INNER JOIN usuarios r ON r.id = m.registrado_por
     LEFT JOIN usuarios cancelador ON cancelador.id = m.cancelado_por
     WHERE (
       $1::BOOLEAN = TRUE
       OR m.estudiante_id = $2
     )
       AND (
         $3::TEXT = ''
         OR STRPOS(LOWER(c.nombre), LOWER($3)) > 0
         OR STRPOS(
           LOWER(CONCAT(u.nombres, ' ', u.apellidos)),
           LOWER($3)
         ) > 0
       )
       AND ($4::TEXT = '' OR m.estado = $4)
     ORDER BY m.fecha_matricula DESC, m.id DESC`,
    [esAdministrador, usuario.id, buscar, estado]
  );

  const matriculas = resultado.rows;

  const formatoFecha = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Lima",
  });

  const enlaceReporte =
    "/api/reportes/matriculas?" +
    new URLSearchParams({
      buscar,
      estado,
    }).toString();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <MenuNavegacion rol={usuario.rol} />

      <section className="mx-auto max-w-5xl">
        <Link
          href="/panel"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver al panel
        </Link>

        <header className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {esAdministrador
                ? "Todas las matrículas"
                : "Mis matrículas"}
            </h1>

            <p className="mt-2 text-slate-600">
              {esAdministrador
                ? "Consulta las inscripciones de los estudiantes."
                : "Consulta tus cursos inscritos y sus horarios."}
            </p>
          </div>

          <Link
            href="/cursos"
            className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
          >
            Ver cursos
          </Link>
        </header>

        <form
          action="/matriculas"
          method="GET"
          className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl bg-white p-5 shadow-sm"
        >
          <label className="min-w-0 flex-1 text-sm font-medium text-slate-700">
            {esAdministrador
              ? "Buscar estudiante o curso"
              : "Buscar curso"}

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
            Estado
            <select
              key={estado}
              name="estado"
              defaultValue={estado}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVA">Activas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
          >
            Buscar
          </button>

          <Link
            href="/matriculas"
            className="rounded-xl border border-slate-300 px-5 py-3 text-slate-700 hover:bg-slate-50"
          >
            Limpiar
          </Link>
        </form>

        {esAdministrador && (
          <div className="mt-5">
            <a
              href={enlaceReporte}
              download
              className="inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Descargar reporte CSV
            </a>

            <p className="mt-2 text-xs text-slate-500">
              El reporte utiliza los filtros aplicados al pulsar Buscar.
              Sin filtros, incluye todas las matrículas.
            </p>
          </div>
        )}

        <p className="my-6 text-sm text-slate-600">
          {matriculas.length}{" "}
          {matriculas.length === 1
            ? "matrícula encontrada"
            : "matrículas encontradas"}
        </p>

        {matriculas.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              {buscar || estado
                ? "No se encontraron coincidencias"
                : "Aún no hay matrículas"}
            </h2>

            <p className="mt-3 text-slate-600">
              {buscar || estado
                ? "Prueba otros filtros o pulsa Limpiar."
                : esAdministrador
                  ? "Las inscripciones aparecerán en esta sección."
                  : "Visita los cursos disponibles para realizar tu primera matrícula."}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {matriculas.map((matricula) => (
              <article
                key={matricula.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
                      Matrícula #{matricula.id}
                    </p>

                    <h2 className="text-xl font-bold text-slate-900 mt-2">
                      {matricula.curso}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      matricula.estado === "ACTIVA"
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {matricula.estado}
                  </span>
                </div>

                {esAdministrador && (
                  <p className="mt-4 text-sm font-semibold text-slate-800">
                    Estudiante: {matricula.nombres}{" "}
                    {matricula.apellidos}
                  </p>
                )}

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Docente</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {matricula.docente}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Horario</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {matricula.horario}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Modalidad</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {matricula.modalidad}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">Duración</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {matricula.duracion_horas} horas
                    </dd>
                  </div>

                  <div>
                    <dt className="text-slate-500">
                      Fecha de matrícula
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formatoFecha.format(
                        new Date(matricula.fecha_matricula)
                      )}
                    </dd>
                  </div>

                  {esAdministrador && (
                    <div>
                      <dt className="text-slate-500">
                        Registrada por
                      </dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {matricula.registrado_por_nombre}
                      </dd>
                    </div>
                  )}
                </dl>

                {matricula.estado === "CANCELADA" && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h3 className="font-semibold text-amber-900">
                      Detalle de cancelación
                    </h3>

                    <p className="mt-2 whitespace-pre-line break-words text-sm text-amber-900">
                      <strong>Motivo: </strong>
                      {matricula.motivo_cancelacion ||
                        "Sin motivo registrado."}
                    </p>

                    <p className="mt-2 text-sm text-amber-800">
                      <strong>Fecha: </strong>
                      {matricula.fecha_cancelacion
                        ? formatoFecha.format(
                            new Date(matricula.fecha_cancelacion)
                          )
                        : "Sin fecha registrada."}
                    </p>

                    {esAdministrador && (
                      <p className="mt-2 text-sm text-amber-800">
                        <strong>Cancelada por: </strong>
                        {matricula.cancelado_por_nombre ||
                          "Sin información."}
                      </p>
                    )}
                  </div>
                )}

                {matricula.estado === "ACTIVA" && (
                  <div className="mt-5">
                    <a
                      href={`/api/matriculas/${matricula.id}/constancia`}
                      download
                      className="inline-block rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                    >
                      Descargar constancia PDF
                    </a>

                    <BotonCancelarMatricula
                      matriculaId={matricula.id}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function MatriculasPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando matrículas...
        </main>
      }
    >
      <ContenidoMatriculas searchParams={searchParams} />
    </Suspense>
  );
}