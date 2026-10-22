"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type RespuestaLogin = {
  mensaje?: string;
  usuario?: {
    id: number;
    nombres: string;
    apellidos: string;
    correo: string;
    rol: string;
  };
};

export default function LoginPage() {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    setCargando(true);
    setMensaje("");
    setExito(false);

    try {
      const respuesta = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          correo: String(datos.get("correo") ?? ""),
          password: String(datos.get("password") ?? ""),
        }),
      });

      const resultado: RespuestaLogin = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo iniciar sesión."
        );
        return;
      }

      if (!resultado.usuario) {
        setMensaje("El servidor devolvió una respuesta inesperada.");
        return;
      }

      setExito(true);
      setMensaje(
        `Bienvenido/a, ${resultado.usuario.nombres}. ` +
        `Inicio de sesión correcto. Rol: ${resultado.usuario.rol}.`
      );

      formulario.reset();
      window.location.assign("/panel");
    } catch {
      setMensaje(
        "No se pudo completar la solicitud. " +
        "Verifica que el servidor esté funcionando."
      );
    } finally {
      setCargando(false);
    }
  }

  const estiloInput =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white " +
    "px-4 py-3 text-slate-900 outline-none " +
    "focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-10">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            Sistema de matrículas
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Iniciar sesión
          </h1>

          <p className="mt-2 text-slate-600">
            Ingresa con tu cuenta de estudiante o administrador.
          </p>
        </div>

        <form onSubmit={iniciarSesion} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input
              name="correo"
              type="email"
              autoComplete="username"
              placeholder="nombre@correo.com"
              required
              maxLength={150}
              disabled={cargando}
              className={estiloInput}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              required
              minLength={8}
              maxLength={72}
              disabled={cargando}
              className={estiloInput}
            />
          </label>

          {mensaje && (
            <p
              role="status"
              aria-live="polite"
              className={`rounded-xl p-4 text-sm ${
                exito
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-violet-600 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </section>
    </main>
  );
}