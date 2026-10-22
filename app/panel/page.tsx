import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../lib/auth";
import { pool } from "../../lib/db";
import CerrarSesion from "../../components/CerrarSesion";
import MenuNavegacion from "../../components/MenuNavegacion";

type IndicadoresAdmin = {
  estudiantes_activos: number;
  cursos: number;
  matriculas_activas: number;
  cupos_disponibles: number;
};

type IndicadoresEstudiante = {
  cursos_publicados: number;
  matriculas_activas: number;
  matriculas_canceladas: number;
};

async function ContenidoPanel() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  const esAdministrador = usuario.rol === "ADMINISTRADOR";

  let indicadores: {
    titulo: string;
    cantidad: number;
  }[] = [];

  if (esAdministrador) {
    const resultado = await pool.query<IndicadoresAdmin>(
      `SELECT
        (
          SELECT COUNT(*)::INTEGER
          FROM usuarios
          WHERE rol = 'ESTUDIANTE'
            AND activo = TRUE
        ) AS estudiantes_activos,

        (
          SELECT COUNT(*)::INTEGER
          FROM cursos
        ) AS cursos,

        (
          SELECT COUNT(*)::INTEGER
          FROM matriculas
          WHERE estado = 'ACTIVA'
        ) AS matriculas_activas,

        (
          SELECT COALESCE(
            SUM(
              GREATEST(
                c.capacidad - (
                  SELECT COUNT(*)::INTEGER
                  FROM matriculas m
                  WHERE m.curso_id = c.id
                    AND m.estado = 'ACTIVA'
                ),
                0
              )
            ),
            0
          )::INTEGER
          FROM cursos c
          WHERE c.publicado = TRUE
        ) AS cupos_disponibles`
    );

    const datos = resultado.rows[0];

    indicadores = [
      {
        titulo: "Estudiantes activos",
        cantidad: datos.estudiantes_activos,
      },
      {
        titulo: "Cursos registrados",
        cantidad: datos.cursos,
      },
      {
        titulo: "Matrículas activas",
        cantidad: datos.matriculas_activas,
      },
      {
        titulo: "Cupos en cursos publicados",
        cantidad: datos.cupos_disponibles,
      },
    ];
  } else {
    const resultado = await pool.query<IndicadoresEstudiante>(
      `SELECT
        (
          SELECT COUNT(*)::INTEGER
          FROM cursos
          WHERE publicado = TRUE
        ) AS cursos_publicados,

        (
          SELECT COUNT(*)::INTEGER
          FROM matriculas
          WHERE estudiante_id = $1
            AND estado = 'ACTIVA'
        ) AS matriculas_activas,

        (
          SELECT COUNT(*)::INTEGER
          FROM matriculas
          WHERE estudiante_id = $1
            AND estado = 'CANCELADA'
        ) AS matriculas_canceladas`,
      [usuario.id]
    );

    const datos = resultado.rows[0];

    indicadores = [
      {
        titulo: "Cursos publicados",
        cantidad: datos.cursos_publicados,
      },
      {
        titulo: "Mis matrículas activas",
        cantidad: datos.matriculas_activas,
      },
      {
        titulo: "Mis matrículas canceladas",
        cantidad: datos.matriculas_canceladas,
      },
    ];
  }

  const accesos = esAdministrador
    ? [
        {
          titulo: "Gestionar roles",
          descripcion: "Asignar permisos de administrador o estudiante.",
          ruta: "/roles",
        },
        {
          titulo: "Gestionar cursos",
          descripcion: "Consultar, editar, publicar u ocultar cursos.",
          ruta: "/cursos",
        },
        {
          titulo: "Crear curso",
          descripcion: "Registrar una nueva oferta académica.",
          ruta: "/cursos/nuevo",
        },
        {
          titulo: "Gestionar estudiantes",
          descripcion: "Buscar estudiantes y cambiar su estado.",
          ruta: "/estudiantes",
        },
        {
          titulo: "Todas las matrículas",
          descripcion: "Consultar inscripciones y cancelaciones.",
          ruta: "/matriculas",
        },
        {
          titulo: "Matricular estudiante",
          descripcion: "Inscribir a un estudiante en un curso.",
          ruta: "/matriculas/nueva",
        },
      ]
    : [
        {
          titulo: "Ver cursos",
          descripcion: "Consultar cursos y realizar una matrícula.",
          ruta: "/cursos",
        },
        {
          titulo: "Mis matrículas",
          descripcion: "Revisar tus inscripciones y cancelaciones.",
          ruta: "/matriculas",
        },
      ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <MenuNavegacion rol={usuario.rol} />

      <section className="mx-auto max-w-6xl">
        <header className="rounded-2xl bg-violet-700 p-6 text-white sm:p-8">
          <p className="text-sm uppercase tracking-widest text-violet-200">
            Sistema de matrículas
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Hola, {usuario.nombres}
          </h1>

          <p className="mt-2 text-violet-100">
            {esAdministrador
              ? "Bienvenido al panel de administración."
              : "Bienvenido a tu espacio de estudiante."}
          </p>

          <span className="mt-5 inline-block rounded-full bg-white/20 px-4 py-2 text-xs font-semibold">
            {usuario.rol}
          </span>

          <CerrarSesion />
        </header>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Resumen
          </h2>

          <div
            className={`grid gap-4 sm:grid-cols-2 ${
              esAdministrador ? "lg:grid-cols-4" : "lg:grid-cols-3"
            }`}
          >
            {indicadores.map((indicador) => (
              <article
                key={indicador.titulo}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <h3 className="text-sm font-medium text-slate-500">
                  {indicador.titulo}
                </h3>

                <p className="mt-3 text-4xl font-bold text-violet-700">
                  {indicador.cantidad}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Accesos rápidos
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accesos.map((acceso) => (
              <Link
                key={acceso.ruta}
                href={acceso.ruta}
                className="rounded-2xl border border-transparent bg-white p-6 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
              >
                <h3 className="font-bold text-violet-800">
                  {acceso.titulo} →
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {acceso.descripcion}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Tu cuenta
          </h2>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Nombre completo</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {usuario.nombres} {usuario.apellidos}
              </dd>
            </div>

            <div>
              <dt className="text-slate-500">Correo electrónico</dt>
              <dd className="mt-1 break-words font-medium text-slate-900">
                {usuario.correo}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="/perfil"
              className="inline-block rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Editar mi perfil
            </Link>

            <Link
              href="/cambiar-password"
              className="inline-block text-sm font-semibold text-violet-700 hover:underline"
            >
              Cambiar mi contraseña
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

export default function PanelPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando tu panel...
        </main>
      }
    >
      <ContenidoPanel />
    </Suspense>
  );
}