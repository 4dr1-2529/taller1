# API REST

Base: `http://localhost:4000/api/v1`

## Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login → JWT |
| GET | `/auth/me` | Perfil |
| POST | `/auth/refresh` | Renovar token |

## Académico (Director)

| Método | Ruta | Roles |
|--------|------|-------|
| GET/POST | `/students` | admin |
| GET/POST | `/teachers` | admin |
| GET/POST/PUT | `/courses` | admin, docente |
| GET/POST | `/enrollments` | admin |
| GET/POST | `/grades` | admin, docente |
| GET/POST | `/attendance` | admin, docente |

## Predicción

| Método | Ruta | Respuesta tesis |
|--------|------|-----------------|
| POST | `/predict` | `score_predictivo`, `probabilidad_abandono`, `nivel_riesgo`, `factores_riesgo`, `recomendacion`, `modelo_usado`, `fecha_prediccion` |
| GET | `/predictions` | Historial |
| GET | `/dashboard/kpis` | Analytics |

## Alertas

| Método | Ruta |
|--------|------|
| GET | `/alerts` |
| PATCH | `/alerts/:id` — body: `{ "status": "nueva" \| "en_seguimiento" \| "resuelta" }` |

## Mensajería académica

| Método | Ruta |
|--------|------|
| GET | `/messages/rooms` |
| GET | `/messages/:roomId` |
| POST | `/messages` |
| PATCH | `/messages/:roomId/read` |

## ML (puerto 5000)

| Método | Ruta |
|--------|------|
| POST | `/predict` |
| GET | `/metrics` |
| GET | `/health` |

Colección Postman: `docs/postman/tesis-dashboard.postman_collection.json`
