import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "../../../lib/auth";
import { pool } from "../../../lib/db";
import FormularioMatricula from "../../../components/FormularioMatricula";

async function ContenidoNuevaMatricula() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/login");
  }

  if (usuario.rol !== "ADMINISTRADOR") {
    redirect("/panel");
  }

  const [resultadoEstudiantes, resultadoCursos] = await Promise.all([
    pool.query<{
      id: number;
      nombres: string;
      apellidos: string;
      dni: string;
    }>(
      `SELECT id, nombres, apellidos, dni
       FROM usuarios
       WHERE rol = 'ESTUDIANTE'
         AND activo = TRUE
       ORDER BY apellidos, nombres`
    ),

    pool.query<{
      id: number;
      nombre: string;
      disponibles: number;
    }>(
      `SELECT
        c.id,
        c.nombre,
        c.capacidad - (
          SELECT COUNT(*)::INTEGER
          FROM matriculas m
          WHERE m.curso_id = c.id
            AND m.estado = 'ACTIVA'
        ) AS disponibles
       FROM cursos c
       WHERE c.publicado = TRUE
       ORDER BY c.nombre`
    ),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/matriculas"
          className="text-sm font-semibold text-violet-700 hover:underline"
        >
          ← Volver a matrículas
        </Link>

        <div className="mt-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Matricular estudiante
          </h1>

          <p className="mb-8 mt-2 text-slate-600">
            Selecciona al estudiante y el curso.
          </p>

          <FormularioMatricula
            estudiantes={resultadoEstudiantes.rows}
            cursos={resultadoCursos.rows}
          />
        </div>
      </section>
    </main>
  );
}

export default function NuevaMatriculaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-10">
          Cargando formulario...
        </main>
      }
    >
      <ContenidoNuevaMatricula />
    </Suspense>
  );
}