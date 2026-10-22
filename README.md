# Sistema de matrículas a cursos

Aplicación desarrollada con React, Next.js, TypeScript y PostgreSQL.

## Funcionalidades

- Registro e inicio de sesión.
- Roles de administrador y estudiante.
- Gestión de cursos y estudiantes.
- Matrículas realizadas por el estudiante o el administrador.
- Configuración de horarios y validación de cruces.
- Cancelación de matrículas.
- Constancias PDF y reportes CSV.
- Edición del perfil.

## Requisitos

- Node.js 22 y npm.
- PostgreSQL.
- Git.
- pgAdmin o una herramienta para ejecutar SQL.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/yasmincam/sistema-matriculas.git
cd sistema-matriculas
npm ci
```

### 2. Crear la base de datos

En pgAdmin, crea una base de datos llamada:

```text
sistema_matriculas
```

Abre Query Tool sobre esa base de datos, carga el archivo
`database/schema.sql` y ejecútalo.

La exportación contiene únicamente la estructura, sin cuentas ni datos.

### 3. Configurar la conexión

Copia `.env.example` como `.env.local`.

En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Edita `.env.local` con el puerto, usuario y contraseña de tu PostgreSQL.

### 4. Ejecutar el proyecto

```bash
npm run dev
```

Abre la dirección que indique la terminal, normalmente:

```text
http://localhost:3000
```

### 5. Crear el primer administrador

Registra una cuenta desde `/registro`.

Después, en pgAdmin, ejecuta esta consulta reemplazando
`tu-correo@ejemplo.com` por el correo de esa cuenta:

```sql
UPDATE usuarios
SET rol = 'ADMINISTRADOR'
WHERE LOWER(correo) = LOWER('tu-correo@ejemplo.com')
RETURNING id, nombres, apellidos, rol;
```

Cierra sesión y vuelve a ingresar.

Las siguientes cuentas de administrador pueden asignarse
desde la opción Gestionar roles.

## Compilación de producción

```bash
npm run build
npm start
```

## Configuración privada

El archivo `.env.local` no se incluye en el repositorio.
Cada persona debe configurar sus propias credenciales.