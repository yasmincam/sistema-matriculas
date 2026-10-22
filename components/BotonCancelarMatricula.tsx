"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  matriculaId: number;
};

export default function BotonCancelarMatricula({
  matriculaId,
}: Props) {
  const router = useRouter();

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function cancelar() {
    const motivo = window.prompt(
      "Escribe el motivo de cancelación (entre 5 y 500 caracteres):"
    );

    if (motivo === null) return;

    const texto = motivo.trim();

    if (texto.length < 5 || texto.length > 500) {
      setMensaje("El motivo debe tener entre 5 y 500 caracteres.");
      return;
    }

    if (!window.confirm("¿Confirmas que deseas cancelar esta matrícula?")) {
      return;
    }

    setCargando(true);
    setMensaje("");

    try {
      const respuesta = await fetch("/api/matriculas/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matriculaId,
          motivo: texto,
        }),
      });

      if (respuesta.status === 401) {
        window.location.replace("/login");
        return;
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo cancelar la matrícula."
        );

        if (respuesta.status === 409) {
          router.refresh();
        }

        return;
      }

      router.refresh();
    } catch {
      setMensaje("No se pudo comunicar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={cancelar}
        disabled={cargando}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {cargando ? "Cancelando..." : "Cancelar matrícula"}
      </button>

      {mensaje && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {mensaje}
        </p>
      )}
    </div>
  );
}