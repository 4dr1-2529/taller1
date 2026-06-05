# API REST

Base: `http://localhost:4000/api/v1`

Todas las respuestas exitosas: `{ "success": true, "message": "...", "data": { ... } }`  
Errores: `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }`

## Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login → JWT |
| GET | `/auth/me` | Perfil autenticado |
| POST | `/auth/refresh` | Renovar token |
| POST | `/auth/change-password` | Cambio de contraseña |

---

## Director (`admin`)

| Método | Ruta | Notas |
|--------|------|-------|
| GET/POST | `/students` | CRUD estudiantes |
| GET/POST/PUT/DELETE | `/teachers` | CRUD profesores |
| GET/POST/PUT | `/courses` | Oferta académica |
| GET/POST | `/matriculas` | Matrícula institucional |
| GET/POST/DELETE | `/grades` | Calificaciones |
| GET/POST/PUT/DELETE | `/attendance` | Asistencia |
| POST | `/predict` | Predicción por `studentId` |
| GET | `/predictions` | Historial global |
| GET | `/dashboard/kpis` | KPIs institucionales |
| GET | `/alerts` | Alertas |
| PATCH | `/alerts/:id` | Cambiar estado alerta |
| GET/POST | `/reports` | Reportes |
| GET/POST | `/messages/*` | Mensajería (incl. global) |

---

## Profesor (`docente`)

Prefijo **`/profesor/*`** — alcance: secciones donde el docente tiene curso activo.

| Método | Ruta |
|--------|------|
| GET | `/profesor/dashboard` |
| GET | `/profesor/grados` |
| GET | `/profesor/secciones?gradoId=` |
| GET | `/profesor/cursos` |
| GET | `/profesor/estudiantes` |
| GET | `/profesor/notas` |
| POST | `/profesor/notas` |
| GET | `/profesor/asistencia` |
| POST | `/profesor/asistencia/masiva` |
| GET | `/profesor/lms` |
| GET | `/profesor/predicciones` |
| POST | `/profesor/predicciones` |
| GET | `/profesor/historial-predicciones` |
| GET | `/profesor/alertas` |
| PATCH | `/profesor/alertas/:id/estado` |

Query común: `gradoId`, `seccionId`, `cursoId`, `search`, `bimestre`, `fecha`, `status`.

---

## Estudiante (`estudiante`)

Prefijo **`/estudiante/*`** — el `studentId` se obtiene **solo del token JWT**.  
Si el cliente envía otro `studentId` → **403 Forbidden**.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/estudiante/perfil` | Código, grado, sección, periodo |
| GET | `/estudiante/dashboard` | KPIs y resumen personal |
| GET | `/estudiante/notas` | Tabla por curso/bimestre (solo lectura) |
| GET | `/estudiante/asistencia` | Filtros: `mes`, `bimestre`, `estado`, `desde`, `hasta` |
| GET | `/estudiante/lms` | Actividad LMS propia |
| GET | `/estudiante/prediccion` | Última predicción y factores |
| POST | `/estudiante/prediccion` | Actualizar predicción propia |
| GET | `/estudiante/alertas` | Alertas activas (solo lectura) |
| GET | `/estudiante/mensajes` | Mensajes recibidos |

**Bloqueado para estudiante:** `/students`, `/grades`, `/attendance`, `/predictions`, `/alerts`, `/dashboard/kpis`, `/profesor/*`.

---

## Mensajería académica (todos los roles autenticados)

| Método | Ruta |
|--------|------|
| GET | `/messages/rooms` |
| GET | `/messages/:roomId` |
| POST | `/messages` |
| PATCH | `/messages/:roomId/read` |

Estudiante: salas globales, curso y directos con profesores. No publica avisos de curso ni comunicados globales.

---

## ML Service (puerto 5000)

| Método | Ruta |
|--------|------|
| POST | `/predict` |
| GET | `/metrics` |
| GET | `/health` |

Colección Postman: `docs/postman/tesis-dashboard.postman_collection.json`
