"use client";

import { useState } from "react";

export default function CerrarSesion() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function cerrarSesion() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!respuesta.ok) {
        throw new Error("No se pudo cerrar la sesión.");
      }

      window.location.replace("/login");
    } catch {
      setError("No se pudo cerrar la sesión. Intenta nuevamente.");
      setCargando(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={cerrarSesion}
        disabled={cargando}
        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-60"
      >
        {cargando ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-white">
          {error}
        </p>
      )}
    </div>
  );
}