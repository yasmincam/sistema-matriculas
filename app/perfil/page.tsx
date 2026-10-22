import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../lib/auth";
import FormularioPerfil from "../../components/FormularioPerfil";

async function ContenidoPerfil() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-xl">
        <Link
          href="/panel"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver al panel
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Editar mi perfil
        </h1>

        <p className="mt-2 text-slate-600">
          Corrige tus nombres y apellidos.
        </p>

        <FormularioPerfil
          nombres={usuario.nombres}
          apellidos={usuario.apellidos}
        />
      </section>
    </main>
  );
}

export default function PerfilPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando tu perfil...
        </main>
      }
    >
      <ContenidoPerfil />
    </Suspense>
  );
}