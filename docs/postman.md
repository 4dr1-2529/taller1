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

- Director: `director@blenkir.edu.pe` / `DEMO_PASSWORD`
- Profesor tutor: `pro50000001@blenkir.edu.pe` / `DEMO_PASSWORD`
- Estudiante: `mateo.quispe0001@blenkir.edu.pe` / `DEMO_PASSWORD`
- Listado completo: `docs/cuentas-demo/estudiantes.csv` y `profesores.csv` (columna `email_login`)
