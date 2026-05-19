# Diagrama Entidad-Relación (DER)

## Modelo conceptual

```mermaid
erDiagram
    USUARIO ||--o{ SESION : tiene
    USUARIO ||--o{ NOTIFICACION : recibe
    PROFESOR ||--o{ CURSO : dicta
    ESTUDIANTE ||--o{ MATRICULA : inscribe
    CURSO ||--o{ MATRICULA : ofrece
    ESTUDIANTE ||--o{ HISTORIAL_ACADEMICO : registra
    ESTUDIANTE ||--o{ ACTIVIDAD_LMS : genera
    ESTUDIANTE ||--o{ ASISTENCIA : tiene
    ESTUDIANTE ||--o{ PREDICCION_IA : recibe
    ESTUDIANTE ||--o{ ALERTA : dispara
    ESTUDIANTE ||--o{ RECOMENDACION_IA : sugiere
    ESTUDIANTE ||--o{ SEGUIMIENTO_PSICO : atiende
    ESTUDIANTE ||--o{ RIESGO_ESTUDIANTIL : evoluciona
```

## Entidades fuertes

- `ESTUDIANTE`, `PROFESOR`, `CURSO`, `USUARIO`

## Entidades débiles / dependientes

- `MATRICULA`, `HISTORIAL_ACADEMICO`, `ACTIVIDAD_LMS`, `PREDICCION_IA`, `ALERTA`

## Relaciones N:M

- Estudiante ↔ Curso vía **Matrícula** (con atributos: promedio, asistencia, periodo)

## Mejoras ≥40% vs. versión anterior

| Antes | Ahora |
|-------|-------|
| Sin BD (solo seed en memoria) | 18+ tablas normalizadas |
| Sin auditoría | Bitácora + triggers |
| Sin historial | Historial académico y riesgo por periodo |
| Sin roles | RBAC con 5 roles |
| Predicción efímera | Tabla `predicciones_ia` con trazabilidad |
| Sin alertas persistentes | Alertas con estados y workflow |

El esquema PostgreSQL completo está en `database/postgresql/schema.sql`.
