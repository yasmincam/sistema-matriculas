"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function FormularioEstudiante() {
  const router = useRouter();

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (guardando) {
      return;
    }

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    const password = String(datos.get("password") ?? "");
    const confirmarPassword = String(
      datos.get("confirmarPassword") ?? ""
    );

    setMensaje("");

    if (password !== confirmarPassword) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/estudiantes/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres: String(datos.get("nombres") ?? ""),
          apellidos: String(datos.get("apellidos") ?? ""),
          dni: String(datos.get("dni") ?? ""),
          correo: String(datos.get("correo") ?? ""),
          password,
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo registrar al estudiante."
        );
        return;
      }

      formulario.reset();
      window.alert("Estudiante registrado correctamente.");

      router.push("/estudiantes");
      router.refresh();
    } catch {
      setMensaje(
        "No se pudo conectar con el servidor. Intenta nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  }

  const estiloCampo =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white " +
    "px-4 py-3 text-slate-900 outline-none focus:border-violet-500 " +
    "focus:ring-2 focus:ring-violet-200";

  return (
    <form
      onSubmit={registrar}
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm"
    >
      <fieldset disabled={guardando} className="space-y-5">
        <div>
          <label
            htmlFor="nombres"
            className="text-sm font-medium text-slate-700"
          >
            Nombres
          </label>

          <input
            id="nombres"
            name="nombres"
            type="text"
            required
            maxLength={100}
            autoComplete="off"
            className={estiloCampo}
          />
        </div>

        <div>
          <label
            htmlFor="apellidos"
            className="text-sm font-medium text-slate-700"
          >
            Apellidos
          </label>

          <input
            id="apellidos"
            name="apellidos"
            type="text"
            required
            maxLength={100}
            autoComplete="off"
            className={estiloCampo}
          />
        </div>

        <div>
          <label
            htmlFor="dni"
            className="text-sm font-medium text-slate-700"
          >
            DNI
          </label>

          <input
            id="dni"
            name="dni"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{8}"
            minLength={8}
            maxLength={8}
            title="Ingresa exactamente 8 dígitos."
            required
            className={estiloCampo}
          />
        </div>

        <div>
          <label
            htmlFor="correo"
            className="text-sm font-medium text-slate-700"
          >
            Correo electrónico
          </label>

          <input
            id="correo"
            name="correo"
            type="email"
            required
            maxLength={150}
            autoComplete="off"
            className={estiloCampo}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Contraseña inicial
          </label>

          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-describedby="ayuda-password"
            className={estiloCampo}
          />

          <p
            id="ayuda-password"
            className="mt-2 text-xs text-slate-500"
          >
            Usa al menos 8 caracteres. El estudiante podrá cambiarla
            desde su cuenta.
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmarPassword"
            className="text-sm font-medium text-slate-700"
          >
            Confirmar contraseña
          </label>

          <input
            id="confirmarPassword"
            name="confirmarPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={estiloCampo}
          />
        </div>

        {mensaje && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {mensaje}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Registrando..." : "Registrar estudiante"}
        </button>
      </fieldset>
    </form>
  );
}