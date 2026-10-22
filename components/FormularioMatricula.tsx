"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Estudiante = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
};

type Curso = {
  id: number;
  nombre: string;
  disponibles: number;
};

type Props = {
  estudiantes: Estudiante[];
  cursos: Curso[];
};

export default function FormularioMatricula({
  estudiantes,
  cursos,
}: Props) {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    if (!window.confirm("¿Confirmas la matrícula seleccionada?")) {
      return;
    }

    setCargando(true);
    setMensaje("");
    setExito(false);

    try {
      const respuesta = await fetch("/api/matriculas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estudianteId: Number(datos.get("estudianteId")),
          cursoId: Number(datos.get("cursoId")),
        }),
      });

      if (respuesta.status === 401) {
        window.location.replace("/login");
        return;
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(resultado.mensaje ?? "No se pudo matricular.");
        return;
      }

      setExito(true);
      setMensaje(resultado.mensaje);
      formulario.reset();
    } catch {
      setMensaje("No se pudo comunicar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  const input =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white " +
    "px-4 py-3 text-slate-900";

  const sinOpciones =
    estudiantes.length === 0 || cursos.length === 0;

  return (
    <form onSubmit={guardar} className="space-y-5">
      <fieldset
        disabled={cargando || exito || sinOpciones}
        className="space-y-5"
      >
        <label className="block text-sm font-medium text-slate-700">
          Estudiante
          <select
            name="estudianteId"
            required
            defaultValue=""
            className={input}
          >
            <option value="" disabled>
              Selecciona un estudiante
            </option>

            {estudiantes.map((estudiante) => (
              <option key={estudiante.id} value={estudiante.id}>
                {estudiante.nombres} {estudiante.apellidos}
                {" · DNI: "}
                {estudiante.dni}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Curso
          <select
            name="cursoId"
            required
            defaultValue=""
            className={input}
          >
            <option value="" disabled>
              Selecciona un curso
            </option>

            {cursos.map((curso) => (
              <option
                key={curso.id}
                value={curso.id}
                disabled={curso.disponibles <= 0}
              >
                {curso.nombre} · {Math.max(0, curso.disponibles)} cupos
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={cargando || exito || sinOpciones}
          className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {cargando ? "Registrando..." : "Confirmar matrícula"}
        </button>
      </fieldset>

      {sinOpciones && (
        <p className="text-sm text-amber-800">
          Necesitas estudiantes activos y cursos publicados para continuar.
        </p>
      )}

      {mensaje && (
        <p
          role="status"
          className={`rounded-xl p-4 text-sm ${
            exito
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {mensaje}
        </p>
      )}

      {exito && (
        <Link
          href="/matriculas"
          className="inline-block font-semibold text-violet-700 hover:underline"
        >
          Ver matrícula registrada →
        </Link>
      )}
    </form>
  );
}