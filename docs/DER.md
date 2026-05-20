# Diagrama Entidad-Relación (DER)

## Modelo conceptual

```mermaid
erDiagram
    NIVEL_EDUCATIVO ||--o{ GRADO : contiene
    GRADO ||--o{ SECCION : tiene
    GRADO ||--o{ CURSO_POR_GRADO : define
    CURSO_CATALOGO ||--o{ CURSO_POR_GRADO : asigna
  SECCION ||--o{ ESTUDIANTE : matricula
    SECCION ||--o{ CURSO : oferta
    PROFESOR ||--o{ CURSO : dicta
    ESTUDIANTE ||--o{ MATRICULA : inscribe
    CURSO ||--o{ MATRICULA : ofrece
    ESTUDIANTE ||--o{ NOTA : califica
    CURSO ||--o{ NOTA : evalua
    APODERADO }o--o{ ESTUDIANTE : vincula
    USUARIO ||--o{ SESION : tiene
    ESTUDIANTE ||--o{ ACTIVIDAD_LMS : genera
    ESTUDIANTE ||--o{ PREDICCION_IA : recibe
    ESTUDIANTE ||--o{ ALERTA : dispara
```

**Modelo educativo peruano:** Primaria (1°–6°) y Secundaria (1°–5°), secciones A/B/C por grado.

**DBML (dbdiagram.io):** `database/dbml/schema.dbml`

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
| Sin roles | RBAC con 6 roles (incl. apoderado) |
| Sin niveles/grado/sección | Estructura Primaria/Secundaria Huancayo |
| Predicción efímera | Tabla `predicciones_ia` con trazabilidad |
| Sin alertas persistentes | Alertas con estados y workflow |

El esquema PostgreSQL completo está en `database/postgresql/schema.sql`.
