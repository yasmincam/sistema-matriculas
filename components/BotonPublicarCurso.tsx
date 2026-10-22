"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  cursoId: number;
  publicado: boolean;
};

export default function BotonPublicarCurso({
  cursoId,
  publicado,
}: Props) {
  const router = useRouter();

  const [guardando, setGuardando] = useState(false);
  const [actualizando, iniciarTransicion] = useTransition();
  const [mensaje, setMensaje] = useState("");

  const ocupado = guardando || actualizando;

  async function cambiarPublicacion() {
    const confirmar = window.confirm(
      publicado
        ? "¿Ocultar este curso? Las matrículas existentes se conservarán."
        : "¿Publicar este curso para permitir nuevas matrículas?"
    );

    if (!confirmar) return;

    setGuardando(true);
    setMensaje("");

    try {
      const respuesta = await fetch("/api/cursos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cursoId,
          publicado: !publicado,
        }),
      });

      if (respuesta.status === 401) {
        window.location.replace("/login");
        return;
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo actualizar el curso."
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
    <div className="mt-5">
      <button
        type="button"
        onClick={cambiarPublicacion}
        disabled={ocupado}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${
          publicado
            ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "bg-violet-600 text-white hover:bg-violet-700"
        }`}
      >
        {ocupado
          ? "Actualizando..."
          : publicado
            ? "Ocultar curso"
            : "Publicar curso"}
      </button>

      {mensaje && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {mensaje}
        </p>
      )}
    </div>
  );
}