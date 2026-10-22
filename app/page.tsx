import Link from "next/link";

const pasos = [
  {
    numero: "01",
    titulo: "Crea tu cuenta",
    descripcion:
      "Registra tus datos para acceder como estudiante.",
  },
  {
    numero: "02",
    titulo: "Encuentra tu curso",
    descripcion:
      "Consulta docentes, horarios, modalidades y cupos disponibles.",
  },
  {
    numero: "03",
    titulo: "Confirma tu matrícula",
    descripcion:
      "Inscríbete y descarga tu constancia desde tu cuenta.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5"
        >
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-tight text-violet-700"
          >
            Aula<span className="text-slate-900">Cursos</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/registro"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Registrarme
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-block rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-violet-700">
            Tu próximo paso empieza aquí
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Aprende algo nuevo.
            <span className="block text-violet-700">
              Construye tu futuro.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
            Encuentra un curso para seguir creciendo. Consulta la oferta
            académica, reserva tu cupo y gestiona tus matrículas desde
            un solo lugar.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/registro"
              className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-violet-700"
            >
              Crear mi cuenta →
            </Link>

            <Link
              href="/cursos"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Explorar cursos
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Para consultar los cursos necesitas iniciar sesión.
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-950 p-7 text-white shadow-xl sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200">
            Todo tu aprendizaje, organizado
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Más fácil empezar.
            <br />
            Más fácil continuar.
          </h2>

          <div className="mt-8 space-y-4">
            {[
              {
                titulo: "Cursos a tu alcance",
                texto: "Busca por nombre, docente y categoría.",
              },
              {
                titulo: "Tu cupo, confirmado",
                texto: "Consulta la disponibilidad antes de matricularte.",
              },
              {
                titulo: "Tus documentos a mano",
                texto: "Descarga la constancia de tus matrículas activas.",
              },
            ].map((beneficio) => (
              <div
                key={beneficio.titulo}
                className="rounded-2xl border border-white/15 bg-white/10 p-5"
              >
                <h3 className="font-semibold">
                  {beneficio.titulo}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-violet-100">
                  {beneficio.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            Así de sencillo
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Tres pasos para comenzar
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {pasos.map((paso) => (
              <article
                key={paso.numero}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <span className="text-3xl font-extrabold text-violet-300">
                  {paso.numero}
                </span>

                <h3 className="mt-4 text-lg font-bold">
                  {paso.titulo}
                </h3>

                <p className="mt-2 leading-relaxed text-slate-600">
                  {paso.descripcion}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-violet-100 p-8">
          <div>
            <h2 className="text-2xl font-bold text-violet-950">
              ¿Ya tienes una cuenta?
            </h2>

            <p className="mt-2 text-violet-800">
              Ingresa para consultar tus cursos y matrículas.
            </p>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800"
          >
            Ingresar a mi cuenta
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 text-sm text-slate-500">
          <p>AulaCursos · Sistema de matrículas</p>
          <p>Un espacio para seguir aprendiendo.</p>
        </div>
      </footer>
    </main>
  );
}