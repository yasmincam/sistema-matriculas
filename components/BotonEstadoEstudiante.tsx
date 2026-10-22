"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  estudianteId: number;
  activo: boolean;
};

export default function BotonEstadoEstudiante({
  estudianteId,
  activo,
}: Props) {
  const router = useRouter();

  const [guardando, setGuardando] = useState(false);
  const [actualizando, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState("");

  const ocupado = guardando || actualizando;

  async function cambiarEstado() {
    const confirmar = window.confirm(
      activo
        ? "¿Desactivar este estudiante? Se cerrarán sus sesiones. Sus matrículas se conservarán."
        : "¿Activar este estudiante para permitirle ingresar nuevamente?"
    );

    if (!confirmar) return;

    setGuardando(true);
    setMensaje("");

    try {
      const respuesta = await fetch("/api/estudiantes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estudianteId,
          activo: !activo,
        }),
      });

      if (respuesta.status === 401) {
        window.location.replace("/login");
        return;
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo actualizar el estado."
        );
        return;
      }

      iniciarTransicion(() => {
        router.refresh();
      });
    } catch {
      setMensaje("No se pudo comunicar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={cambiarEstado}
        disabled={ocupado}
        className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-60 ${
          activo
            ? "bg-red-50 text-red-700 hover:bg-red-100"
            : "bg-green-50 text-green-800 hover:bg-green-100"
        }`}
      >
        {ocupado
          ? "Actualizando..."
          : activo
            ? "Desactivar"
            : "Activar"}
      </button>

      {mensaje && (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {mensaje}
        </p>
      )}
    </div>
  );
}