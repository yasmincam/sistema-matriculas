import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { pool } from "./db";

type UsuarioSesion = {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: "ADMINISTRADOR" | "ESTUDIANTE";
};

export async function obtenerUsuarioActual(): Promise<UsuarioSesion | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("sesion")?.value;

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  const resultado = await pool.query<UsuarioSesion>(
    `SELECT
      u.id,
      u.nombres,
      u.apellidos,
      u.correo,
      u.rol
     FROM sesiones s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = $1
       AND s.expira_en > NOW()
       AND u.activo = TRUE`,
    [tokenHash]
  );

  return resultado.rows[0] ?? null;
}