import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../../lib/auth";
import FormularioCurso from "../../../components/FormularioCurso";

async function ContenidoNuevoCurso() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    redirect("/panel");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/panel"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver al panel
        </Link>

        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Crear curso
          </h1>

          <p className="mb-8 mt-2 text-slate-600">
            Completa la información de la nueva oferta académica.
          </p>

          <FormularioCurso />
        </div>
      </section>
    </main>
  );
}

export default function NuevoCursoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10">
          Comprobando permisos...
        </main>
      }
    >
      <ContenidoNuevoCurso />
    </Suspense>
  );
}