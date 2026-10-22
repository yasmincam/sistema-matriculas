"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  rol: "ADMINISTRADOR" | "ESTUDIANTE";
};

export default function MenuNavegacion({ rol }: Props) {
  const pathname = usePathname();

  const enlaces = [
    { nombre: "Panel", ruta: "/panel" },
    { nombre: "Cursos", ruta: "/cursos" },
    {
      nombre:
        rol === "ADMINISTRADOR"
          ? "Matrículas"
          : "Mis matrículas",
      ruta: "/matriculas",
    },
    ...(rol === "ADMINISTRADOR"
      ? [{ nombre: "Estudiantes", ruta: "/estudiantes" }]
      : []),
    { nombre: "Contraseña", ruta: "/cambiar-password" },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="mx-auto mb-6 max-w-6xl rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/panel"
          className="text-xl font-extrabold tracking-tight text-violet-700"
        >
          Aula<span className="text-slate-900">Cursos</span>
        </Link>

        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          {rol === "ADMINISTRADOR"
            ? "Administración"
            : "Estudiante"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {enlaces.map((enlace) => {
          const activo =
            pathname === enlace.ruta ||
            pathname.startsWith(enlace.ruta + "/");

          return (
            <Link
              key={enlace.ruta}
              href={enlace.ruta}
              aria-current={activo ? "page" : undefined}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activo
                  ? "bg-violet-600 text-white"
                  : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              {enlace.nombre}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}