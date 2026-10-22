import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../../lib/auth";
import FormularioEstudiante from "../../../components/FormularioEstudiante";

async function ContenidoRegistroEstudiante() {
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
          href="/estudiantes"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver a estudiantes
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Registrar estudiante
        </h1>

        <p className="mt-2 text-slate-600">
          Crea la cuenta del estudiante. Después podrás matricularlo
          en un curso.
        </p>

        <FormularioEstudiante />
      </section>
    </main>
  );
}

export default function NuevoEstudiantePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando formulario...
        </main>
      }
    >
      <ContenidoRegistroEstudiante />
    </Suspense>
  );
}