import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../lib/auth";
import MenuNavegacion from "../../components/MenuNavegacion";
import BotonEstadoEstudiante from "../../components/BotonEstadoEstudiante";
import { pool } from "../../lib/db";

type Props = {
  searchParams: Promise<{
    buscar?: string | string[];
  }>;
};

type Estudiante = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  activo: boolean;
  matriculas_activas: number;
};

async function ContenidoEstudiantes({ searchParams }: Props) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    redirect("/panel");
  }

  const parametros = await searchParams;

  const buscar =
    typeof parametros.buscar === "string"
      ? parametros.buscar.trim().slice(0, 150)
      : "";

  const resultado = await pool.query<Estudiante>(
    `SELECT
      u.id,
      u.nombres,
      u.apellidos,
      u.dni,
      u.correo,
      u.activo,
      (
        SELECT COUNT(*)::INTEGER
        FROM matriculas m
        WHERE m.estudiante_id = u.id
          AND m.estado = 'ACTIVA'
      ) AS matriculas_activas
     FROM usuarios u
     WHERE u.rol = 'ESTUDIANTE'
       AND (
         $1::TEXT = ''
         OR STRPOS(
           LOWER(CONCAT(u.nombres, ' ', u.apellidos)),
           LOWER($1)
         ) > 0
         OR STRPOS(u.dni, $1) > 0
         OR STRPOS(LOWER(u.correo), LOWER($1)) > 0
       )
     ORDER BY u.apellidos, u.nombres, u.id`,
    [buscar]
  );

  const estudiantes = resultado.rows;

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
              Estudiantes
            </h1>

            <p className="mt-2 text-slate-600">
              Consulta los estudiantes registrados y sus matrículas activas.
            </p>
          </div>

          <Link
            href="/estudiantes/nuevo"
            className="rounded-xl bg-violet-600 px-5 py-3 text-center font-semibold text-white hover:bg-violet-700"
          >
            + Registrar estudiante
          </Link>
        </header>

        <form
          action="/estudiantes"
          method="GET"
          className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm"
        >
          <label className="min-w-0 flex-1 text-sm font-medium text-slate-700">
            Buscar estudiante

            <input
              key={buscar}
              name="buscar"
              type="search"
              defaultValue={buscar}
              maxLength={150}
              placeholder="Nombre, apellido, DNI o correo"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-violet-500"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
          >
            Buscar
          </button>

          <Link
            href="/estudiantes"
            className="rounded-xl border border-slate-300 px-5 py-3 text-slate-700 hover:bg-slate-50"
          >
            Limpiar
          </Link>
        </form>

        <p className="my-5 text-sm text-slate-600">
          {estudiantes.length}{" "}
          {estudiantes.length === 1
            ? "estudiante encontrado"
            : "estudiantes encontrados"}
        </p>

        {estudiantes.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center text-slate-600">
            {buscar
              ? "No se encontraron estudiantes con esa búsqueda."
              : "Todavía no hay estudiantes registrados."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-violet-50 text-violet-900">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Estudiante
                  </th>
                  <th scope="col" className="px-5 py-4">
                    DNI
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Correo
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Estado
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Matrículas activas
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {estudiantes.map((estudiante) => (
                  <tr
                    key={estudiante.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {estudiante.nombres} {estudiante.apellidos}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {estudiante.dni}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {estudiante.correo}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          estudiante.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {estudiante.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {estudiante.matriculas_activas}
                    </td>

                    <td className="px-5 py-4">
                      <BotonEstadoEstudiante
                        estudianteId={estudiante.id}
                        activo={estudiante.activo}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default function EstudiantesPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando estudiantes...
        </main>
      }
    >
      <ContenidoEstudiantes searchParams={searchParams} />
    </Suspense>
  );
}