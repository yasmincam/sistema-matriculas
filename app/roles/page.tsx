import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../lib/auth";
import { pool } from "../../lib/db";
import CambiarRol from "../../components/CambiarRol";

type Cuenta = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: "ADMINISTRADOR" | "ESTUDIANTE";
  activo: boolean;
};

async function ContenidoRoles() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    redirect("/panel");
  }

  const resultado = await pool.query<Cuenta>(
    `SELECT id, nombres, apellidos, correo, rol, activo
     FROM usuarios
     ORDER BY nombres, apellidos, id`
  );

  const cuentas = resultado.rows;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/panel"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver al panel
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Gestionar roles
        </h1>

        <p className="mt-2 text-slate-600">
          Asigna los permisos de estudiante o administrador a las cuentas.
        </p>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Siempre debe existir al menos un administrador activo.
          Cambiar un rol no activa una cuenta desactivada.
        </div>

        <div className="mt-6 space-y-4">
          {cuentas.map((cuenta) => (
            <article
              key={cuenta.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {cuenta.nombres} {cuenta.apellidos}
                    {cuenta.id === usuario.id && (
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        (Tu cuenta)
                      </span>
                    )}
                  </h2>

                  <p className="mt-1 break-words text-sm text-slate-600">
                    {cuenta.correo}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    Rol actual: {cuenta.rol}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    cuenta.activo
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {cuenta.activo ? "Activa" : "Inactiva"}
                </span>
              </div>

              <CambiarRol
                key={`${cuenta.id}-${cuenta.rol}`}
                usuarioId={cuenta.id}
                nombre={`${cuenta.nombres} ${cuenta.apellidos}`}
                rolActual={cuenta.rol}
              />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function RolesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10 text-slate-700">
          Cargando cuentas...
        </main>
      }
    >
      <ContenidoRoles />
    </Suspense>
  );
}