# Frontend (Next.js 16)

Aplicación web del **Tesis Dashboard** — dashboards por rol, validaciones en formularios y consumo de API REST.

## Requisitos

- Node.js 20+
- Backend API en `http://localhost:4000/api/v1`

## Configuración

```bash
# Desde tesis-dashboard/frontend/
cp .env.local.example .env.local   # o cree manualmente:
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## Desarrollo

Desde la raíz del monorepo:

```bash
npm run dev:web
# o
npm run dev --workspace=frontend
```

Puerto: **http://localhost:3029**

```bash
npm run type-check
npm run lint
npm run build
```

## Estructura (`src/`)

```
app/                    # App Router (login, dashboard principal)
components/
  student/              # Vistas rol Estudiante (solo datos propios)
  views/                # Vistas Director / Profesor
  professor/            # Filtros y barras del docente
services/
  api.ts                # Cliente HTTP base
  directorService.ts    # Endpoints director
  profesorService.ts    # Endpoints /profesor/*
  estudianteService.ts  # Endpoints /estudiante/*
hooks/                  # useAcademicData, useProfessorFilters, etc.
constants/estudiante.ts # Mensajes UX del estudiante
```

## Menú por rol

| Rol UI | Secciones visibles |
|--------|-------------------|
| **Director** | Dashboard, Estudiantes, Profesores, Cursos, Matrículas, Notas, Asistencia, LMS, Predicción, Historial, Alertas, Mensajería, Reportes |
| **Profesor** | Dashboard, Estudiantes (sus salones), Cursos, Notas, Asistencia, LMS, Predicción, Historial, Alertas, Mensajería |
| **Estudiante** | Dashboard, Mis notas, Mi asistencia, Mi actividad LMS, Mi riesgo, Mensajería |

El estudiante **no** carga listados globales ni filtros de grado/sección; usa exclusivamente `estudianteService`.

## Credenciales demo

Contraseña: `Tesis2026!`

- Director: `director@blenkir.edu.pe`
- Profesor: `profesor1@blenkir.edu.pe`
- Estudiante: `estudiante0001@blenkir.edu.pe`

Ver [../README.md](../README.md) para seed de base de datos.
