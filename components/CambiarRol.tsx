"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Rol = "ADMINISTRADOR" | "ESTUDIANTE";

type Props = {
  usuarioId: number;
  nombre: string;
  rolActual: Rol;
};

export default function CambiarRol({
  usuarioId,
  nombre,
  rolActual,
}: Props) {
  const router = useRouter();

  const [rol, setRol] = useState<Rol>(rolActual);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  async function guardar() {
    setMensaje("");

    if (rol === rolActual) {
      return;
    }

    const confirmado = window.confirm(
      `¿Cambiar el rol de ${nombre} a ${rol}? ` +
        "Esta cuenta deberá volver a iniciar sesión."
    );

    if (!confirmado) {
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/roles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId,
          rol,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setEsError(true);
        setMensaje(datos.mensaje ?? "No se pudo cambiar el rol.");
        return;
      }

      if (datos.cerrarSesion) {
        window.location.replace("/login");
        return;
      }

      setEsError(false);
      setMensaje(datos.mensaje);
      router.refresh();
    } catch {
      setEsError(true);
      setMensaje("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mt-4">
      <label
        htmlFor={`rol-${usuarioId}`}
        className="block text-sm font-medium text-slate-700"
      >
        Rol de la cuenta
      </label>

      <div className="mt-2 flex flex-wrap gap-3">
        <select
          id={`rol-${usuarioId}`}
          value={rol}
          onChange={(event) => setRol(event.target.value as Rol)}
          disabled={guardando}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
        >
          <option value="ESTUDIANTE">Estudiante</option>
          <option value="ADMINISTRADOR">Administrador</option>
        </select>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando || rol === rolActual}
          className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar rol"}
        </button>
      </div>

      {mensaje && (
        <p
          role="status"
          className={`mt-3 text-sm ${
            esError ? "text-red-700" : "text-green-700"
          }`}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}