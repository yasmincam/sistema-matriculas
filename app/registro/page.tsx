"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cargando) {
      return;
    }

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    const password = String(datos.get("password") ?? "");
    const confirmacion = String(datos.get("confirmacion") ?? "");

    setExito(false);
    setMensaje("");

    if (password !== confirmacion) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setMensaje(
        "La contraseña es demasiado larga. Utiliza un máximo de 72 bytes."
      );
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch("/api/auth/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres: datos.get("nombres"),
          apellidos: datos.get("apellidos"),
          dni: datos.get("dni"),
          correo: datos.get("correo"),
          password,
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo completar el registro."
        );
        return;
      }

      setExito(true);
      setMensaje(
        "Tu cuenta de estudiante se creó correctamente. Ya puedes iniciar sesión."
      );

      formulario.reset();
    } catch {
      setMensaje(
        "No se pudo comunicar con el servidor. Intenta nuevamente."
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
      <section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-lg sm:p-10">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver al inicio
        </Link>

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            Sistema de matrículas
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Crea tu cuenta
          </h1>

          <p className="mt-2 text-slate-600">
            Regístrate como estudiante para matricularte en nuestros cursos.
          </p>
        </div>

        <form onSubmit={registrar} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Nombres
              <input
                name="nombres"
                type="text"
                autoComplete="given-name"
                placeholder="Tus nombres"
                required
                maxLength={100}
                disabled={cargando}
                className={estiloInput}
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Apellidos
              <input
                name="apellidos"
                type="text"
                autoComplete="family-name"
                placeholder="Tus apellidos"
                required
                maxLength={100}
                disabled={cargando}
                className={estiloInput}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            DNI
            <input
              name="dni"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{8}"
              title="Ingresa exactamente 8 dígitos"
              placeholder="8 dígitos"
              required
              minLength={8}
              maxLength={8}
              disabled={cargando}
              className={estiloInput}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Correo electrónico
            <input
              name="correo"
              type="email"
              autoComplete="email"
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
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              maxLength={72}
              disabled={cargando}
              className={estiloInput}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Confirmar contraseña
            <input
              name="confirmacion"
              type="password"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              required
              minLength={8}
              maxLength={72}
              disabled={cargando}
              className={estiloInput}
            />
          </label>

          {mensaje && (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl p-4 text-sm ${
                exito
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <p>{mensaje}</p>

              {exito && (
                <Link
                  href="/login"
                  className="mt-3 inline-block font-semibold underline"
                >
                  Ir a iniciar sesión →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {cargando ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-700 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}