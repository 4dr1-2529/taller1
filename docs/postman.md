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

## Cuentas (Data Seed V5)

Las contraseñas **no se publican**: cada rol usa su variable de entorno en Railway
(`DIRECTOR_INITIAL_PASSWORD`, `TEACHER_INITIAL_PASSWORD`, `STUDENT_INITIAL_PASSWORD`).

- Director: `director@blenkir.edu.pe`
- Profesor: `prof001@blenkir.edu.pe`
- Estudiante: `est0002@alumnos.blenkir.edu.pe`
- Listado completo de las 275 cuentas: [BLENKIR_LOGIN_ACCOUNTS_2026.md](BLENKIR_LOGIN_ACCOUNTS_2026.md)
