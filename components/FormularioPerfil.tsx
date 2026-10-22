"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  nombres: string;
  apellidos: string;
};

export default function FormularioPerfil({
  nombres,
  apellidos,
}: Props) {
  const router = useRouter();

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (guardando) {
      return;
    }

    const datos = new FormData(event.currentTarget);

    setMensaje("");
    setGuardando(true);

    try {
      const respuesta = await fetch("/api/perfil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombres: String(datos.get("nombres") ?? ""),
          apellidos: String(datos.get("apellidos") ?? ""),
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo actualizar el perfil."
        );
        return;
      }

      router.push("/panel");
      router.refresh();
    } catch {
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  const estiloCampo =
    "mt-2 w-full rounded-xl border border-slate-300 " +
    "bg-white px-4 py-3 text-slate-900 outline-none " +
    "focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  return (
    <form
      onSubmit={guardar}
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm"
    >
      <fieldset disabled={guardando} className="space-y-5">
        <label className="block text-sm font-medium text-slate-700">
          Nombres
          <input
            name="nombres"
            type="text"
            defaultValue={nombres}
            autoComplete="given-name"
            required
            maxLength={100}
            className={estiloCampo}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Apellidos
          <input
            name="apellidos"
            type="text"
            defaultValue={apellidos}
            autoComplete="family-name"
            required
            maxLength={100}
            className={estiloCampo}
          />
        </label>

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
          className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </fieldset>

      <Link
        href="/panel"
        className="mt-4 block text-center text-sm font-semibold text-slate-600 hover:underline"
      >
        Volver al panel
      </Link>
    </form>
  );
}