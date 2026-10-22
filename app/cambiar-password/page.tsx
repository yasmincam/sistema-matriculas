"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function CambiarPasswordPage() {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    const nueva = String(datos.get("nueva") ?? "");
    const confirmar = String(datos.get("confirmar") ?? "");

    setMensaje("");

    if (nueva !== confirmar) {
      setMensaje("Las contraseñas nuevas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch("/api/auth/cambiar-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actual: datos.get("actual"),
          nueva,
        }),
      });

      if (respuesta.status === 401) {
        window.location.replace("/login");
        return;
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(resultado.mensaje ?? "No se pudo guardar.");
        return;
      }

      setExito(true);
      setMensaje(resultado.mensaje);
      formulario.reset();
    } catch {
      setMensaje("No se pudo comunicar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  const input =
    "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 " +
    "text-slate-900 outline-none focus:border-violet-500";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
        {!exito && (
          <Link
            href="/panel"
            className="text-sm font-semibold text-violet-700"
          >
            ← Volver al panel
          </Link>
        )}

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Cambiar contraseña
        </h1>

        <p className="mb-6 mt-2 text-sm text-slate-600">
          Al guardar, se cerrarán todas tus sesiones.
        </p>

        <form onSubmit={guardar}>
          <fieldset
            disabled={cargando || exito}
            className="space-y-5"
          >
            <label className="block text-sm text-slate-700">
              Contraseña actual
              <input
                name="actual"
                type="password"
                autoComplete="current-password"
                required
                maxLength={72}
                className={input}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Nueva contraseña
              <input
                name="nueva"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                className={input}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Confirmar nueva contraseña
              <input
                name="confirmar"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                className={input}
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {cargando ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </fieldset>
        </form>

        {mensaje && (
          <p
            role="status"
            className={`mt-5 rounded-xl p-4 text-sm ${
              exito
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {mensaje}
          </p>
        )}

        {exito && (
          <a
            href="/login"
            className="mt-5 inline-block font-semibold text-violet-700"
          >
            Iniciar sesión nuevamente →
          </a>
        )}
      </section>
    </main>
  );
}