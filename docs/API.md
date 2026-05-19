# API REST v1

Base URL: `http://localhost:4000/api/v1`

## Autenticación

```http
POST /auth/login
Content-Type: application/json

{ "email": "admin@iep-huancayo.edu.pe", "password": "Tesis2026!" }
```

Respuesta: `{ "ok": true, "token": "...", "user": { ... } }`

Cabecera en rutas protegidas: `Authorization: Bearer <token>`

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Estado del servicio |
| GET | /auth/me | Usuario actual |
| GET | /students | Listado paginado (`?q=&page=&limit=`) |
| POST | /students | Crear estudiante |
| GET | /students/:id | Detalle con predicciones |
| GET | /teachers | Profesores |
| GET | /courses | Cursos |
| GET | /enrollments | Matrículas |
| POST | /enrollments | Nueva matrícula |
| POST | /predict | Predicción IA (`studentId` o `metrics`) |
| GET | /dashboard/kpis | KPIs globales |
| GET | /alerts | Alertas abiertas |
| GET | /notifications | Notificaciones del usuario |
| GET | /ml/metrics | Métricas de modelos (RF, XGB, Stacking) |
| GET | /chat/:roomId | Mensajes de sala |
| POST | /chat | Enviar mensaje |

## ML Service

`POST http://localhost:5000/predict` — ver OpenAPI en `/docs`
