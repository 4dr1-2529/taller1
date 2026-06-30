# Pruebas de rendimiento — Carga

**Alcance:** Validación básica de concurrencia (no stress test formal).

---

## Escenarios sugeridos

| Escenario | Usuarios | Duración | Criterio |
|-----------|----------|----------|----------|
| Login concurrente | 10 | 1 min | 0 errores 5xx |
| Listado estudiantes | 5 | 30 s | Respuesta < 3 s |
| Predicción simultánea | 3 | 1 min | ML responde 200 |

---

## Herramientas opcionales

- k6, Apache Bench, o Postman Collection Runner
- No incluido en CI — ejecución manual documentada

---

## Evidencias

[evidencias/](evidencias/)
