"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  cursoId: number;
  nombreCurso: string;
  sinCupos: boolean;
};

export default function BotonMatricula({
  cursoId,
  nombreCurso,
  sinCupos,
}: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  async function matricularse() {
    const confirmar = window.confirm(
      `¿Confirmas tu matrícula en "${nombreCurso}"?`
    );

    if (!confirmar) return;

    setCargando(true);
    setMensaje("");

    try {
      const respuesta = await fetch("/api/matriculas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cursoId }),
      });

      if (respuesta.status === 401) {
        window.location.replace("/login");
        return;
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setExito(false);
        setMensaje(resultado.mensaje ?? "No se pudo realizar la matrícula.");
        router.refresh();
        return;
      }

      setExito(true);
      setMensaje(resultado.mensaje);
      router.refresh();
    } catch {
      setExito(false);
      setMensaje("No se pudo comunicar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={matricularse}
        disabled={cargando || sinCupos || exito}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {exito
          ? "Matrícula registrada"
          : cargando
            ? "Registrando..."
            : sinCupos
              ? "Sin cupos"
              : "Matricularme"}
      </button>

      {mensaje && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-3 rounded-lg p-3 text-sm ${
            exito
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}