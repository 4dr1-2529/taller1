# Postman

## Importar

1. Abrir Postman → Import.
2. Seleccionar `docs/postman/tesis-dashboard.postman_collection.json`.

## Variables de colección

| Variable | Valor por defecto |
|----------|-------------------|
| `baseUrl` | `http://localhost:4000/api/v1` |
| `token` | Se llena automáticamente tras Login válido |
| `studentId`, `courseId`, `alertId` | Completar manualmente desde respuestas |

## Orden sugerido

1. AUTH → Login válido.
2. DIRECTOR → Dashboard KPIs, estudiantes.
3. PROFESOR → Login profesor → cursos → predicción.
4. ESTUDIANTE → Login estudiante → predicciones.
5. ALERTAS → listar y actualizar estado.
6. ML → health y predict.

## Datos demo

Tras `npm run db:seed:demo`:

- Director: `director@iep-huancayo.edu.pe` / `Tesis2026!`
- Profesor: `profesor1@iep-huancayo.edu.pe`
- Estudiante: `estudiante01@iep-huancayo.edu.pe`
