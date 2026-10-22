"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Horario = {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
};

type CursoEditable = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  docente: string;
  modalidad: string;
  horario: string;
  duracion_horas: number;
  capacidad: number;
  publicado: boolean;
  horarios?: Horario[];
};

type Props = {
  curso?: CursoEditable;
};

const dias = [
  { numero: 1, nombre: "Lunes" },
  { numero: 2, nombre: "Martes" },
  { numero: 3, nombre: "Miércoles" },
  { numero: 4, nombre: "Jueves" },
  { numero: 5, nombre: "Viernes" },
  { numero: 6, nombre: "Sábado" },
  { numero: 7, nombre: "Domingo" },
];

function horarioVacio(): Horario {
  return {
    dia_semana: 1,
    hora_inicio: "",
    hora_fin: "",
  };
}

export default function FormularioCurso({ curso }: Props) {
  const router = useRouter();

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);

  const [horarios, setHorarios] = useState<Horario[]>(() =>
    curso?.horarios?.length
      ? curso.horarios.map((horario) => ({
          dia_semana: horario.dia_semana,
          hora_inicio: horario.hora_inicio.slice(0, 5),
          hora_fin: horario.hora_fin.slice(0, 5),
        }))
      : [horarioVacio()]
  );

  const editando = Boolean(curso);

  function actualizarHorario(
    indice: number,
    cambios: Partial<Horario>
  ) {
    setHorarios((actuales) =>
      actuales.map((horario, posicion) =>
        posicion === indice
          ? { ...horario, ...cambios }
          : horario
      )
    );
  }

  function quitarHorario(indice: number) {
    setHorarios((actuales) =>
      actuales.filter((_, posicion) => posicion !== indice)
    );
  }

  function validarHorarios(): string | null {
    for (let i = 0; i < horarios.length; i++) {
      const actual = horarios[i];

      if (!actual.hora_inicio || !actual.hora_fin) {
        return `Completa las horas del bloque ${i + 1}.`;
      }

      if (actual.hora_fin <= actual.hora_inicio) {
        return (
          `En el bloque ${i + 1}, la hora de fin debe ser ` +
          "posterior a la hora de inicio."
        );
      }

      for (let j = 0; j < i; j++) {
        const anterior = horarios[j];

        const seCruzan =
          actual.dia_semana === anterior.dia_semana &&
          actual.hora_inicio < anterior.hora_fin &&
          actual.hora_fin > anterior.hora_inicio;

        if (seCruzan) {
          return (
            `Los bloques ${j + 1} y ${i + 1} ` +
            "tienen un cruce de horario."
          );
        }
      }
    }

    return null;
  }

  async function guardarCurso(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cargando) {
      return;
    }

    setMensaje("");
    setExito(false);

    const errorHorario = validarHorarios();

    if (errorHorario) {
      setMensaje(errorHorario);
      return;
    }

    const formulario = event.currentTarget;
    const datos = new FormData(formulario);

    setCargando(true);

    try {
      const respuesta = await fetch("/api/cursos", {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(curso ? { cursoId: curso.id } : {}),
          nombre: String(datos.get("nombre") ?? ""),
          descripcion: String(datos.get("descripcion") ?? ""),
          categoria: String(datos.get("categoria") ?? ""),
          docente: String(datos.get("docente") ?? ""),
          modalidad: String(datos.get("modalidad") ?? ""),
          horarios,
          duracion_horas: Number(datos.get("duracion_horas")),
          capacidad: Number(datos.get("capacidad")),
          publicado: datos.get("publicado") === "on",
        }),
      });

      if (respuesta.status === 401) {
        window.location.replace("/login");
        return;
      }

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(
          resultado.mensaje ?? "No se pudo guardar el curso."
        );
        return;
      }

      if (editando) {
        router.push("/cursos");
        router.refresh();
        return;
      }

      formulario.reset();
      setHorarios([horarioVacio()]);
      setExito(true);
      setMensaje(`Curso creado: ${resultado.curso.nombre}.`);
    } catch {
      setMensaje("No se pudo comunicar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  const input =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white " +
    "px-4 py-3 text-slate-900 outline-none " +
    "focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

  const label = "block text-sm font-medium text-slate-700";

  const categorias = Array.from(
    new Set([
      "Programación",
      "Diseño",
      "Datos",
      "Cloud",
      "General",
      ...(curso ? [curso.categoria] : []),
    ])
  );

  return (
    <form onSubmit={guardarCurso}>
      <fieldset disabled={cargando} className="space-y-5">
        <label className={label}>
          Nombre del curso
          <input
            name="nombre"
            required
            maxLength={150}
            defaultValue={curso?.nombre ?? ""}
            placeholder="Ej. Desarrollo web con Next.js"
            className={input}
          />
        </label>

        <label className={label}>
          Descripción
          <textarea
            name="descripcion"
            rows={3}
            maxLength={3000}
            defaultValue={curso?.descripcion ?? ""}
            placeholder="¿Qué aprenderán los estudiantes?"
            className={input}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>
            Categoría
            <select
              name="categoria"
              defaultValue={curso?.categoria ?? "Programación"}
              className={input}
            >
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </label>

          <label className={label}>
            Modalidad
            <select
              name="modalidad"
              defaultValue={curso?.modalidad ?? "VIRTUAL"}
              className={input}
            >
              <option value="VIRTUAL">Virtual</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDA">Híbrida</option>
            </select>
          </label>
        </div>

        <label className={label}>
          Docente
          <input
            name="docente"
            required
            maxLength={150}
            defaultValue={curso?.docente ?? ""}
            placeholder="Nombre y apellidos del docente"
            className={input}
          />
        </label>

        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <h2 className="font-semibold text-violet-900">
            Horarios semanales
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Agrega un bloque por cada día de clase. Cada bloque debe
            empezar y terminar dentro del mismo día.
          </p>

          {curso && !curso.horarios?.length && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Horario anterior: {curso.horario || "Sin horario"}.
              Debes registrarlo en los nuevos campos.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {horarios.map((horario, indice) => (
              <div
                key={indice}
                className="rounded-xl border border-violet-100 bg-white p-4"
              >
                <p className="mb-3 text-sm font-semibold text-slate-800">
                  Bloque {indice + 1}
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className={label}>
                    Día
                    <select
                      value={horario.dia_semana}
                      onChange={(event) =>
                        actualizarHorario(indice, {
                          dia_semana: Number(event.target.value),
                        })
                      }
                      className={input}
                    >
                      {dias.map((dia) => (
                        <option
                          key={dia.numero}
                          value={dia.numero}
                        >
                          {dia.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={label}>
                    Hora de inicio
                    <input
                      type="time"
                      required
                      step={60}
                      value={horario.hora_inicio}
                      onChange={(event) =>
                        actualizarHorario(indice, {
                          hora_inicio: event.target.value,
                        })
                      }
                      className={input}
                    />
                  </label>

                  <label className={label}>
                    Hora de fin
                    <input
                      type="time"
                      required
                      step={60}
                      value={horario.hora_fin}
                      onChange={(event) =>
                        actualizarHorario(indice, {
                          hora_fin: event.target.value,
                        })
                      }
                      className={input}
                    />
                  </label>
                </div>

                {horarios.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarHorario(indice)}
                    className="mt-3 text-sm font-semibold text-red-700 hover:underline"
                  >
                    Quitar bloque
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setHorarios((actuales) => [
                ...actuales,
                horarioVacio(),
              ])
            }
            className="mt-4 rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
          >
            + Agregar horario
          </button>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>
            Duración en horas
            <input
              name="duracion_horas"
              type="number"
              required
              min={1}
              max={1000}
              step={1}
              defaultValue={curso?.duracion_horas ?? ""}
              placeholder="48"
              className={input}
            />
          </label>

          <label className={label}>
            Capacidad de estudiantes
            <input
              name="capacidad"
              type="number"
              required
              min={1}
              max={500}
              step={1}
              defaultValue={curso?.capacidad ?? ""}
              placeholder="25"
              className={input}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            name="publicado"
            type="checkbox"
            defaultChecked={curso?.publicado ?? false}
            className="h-4 w-4 accent-violet-600"
          />
          Publicar el curso para los estudiantes
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {cargando
            ? "Guardando..."
            : editando
              ? "Guardar cambios"
              : "Guardar curso"}
        </button>
      </fieldset>

      {mensaje && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-5 rounded-xl p-4 text-sm ${
            exito
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {mensaje}
        </p>
      )}
    </form>
  );
}