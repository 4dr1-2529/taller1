# Arquitectura

## Visión general

Sistema web para **predicción de riesgo de deserción estudiantil** mediante ensemble learning (Random Forest, XGBoost/HGB, Stacking).

```
[Frontend Next.js :3029]
        │ JWT
        ▼
[Backend Express :4000] ──► [MySQL]
        │
        ▼
[ML FastAPI :5000] ──► modelos .joblib
```

## Capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación | Next.js, React, Tailwind | Dashboards por rol, formularios, gráficos |
| API | Express, Prisma, Zod | Auth, RBAC, persistencia, orquestación ML |
| ML | FastAPI, scikit-learn | Entrenamiento, inferencia, métricas |
| Datos | MySQL (XAMPP) | Estudiantes, notas, alertas, mensajes |

## Flujo de predicción

1. Profesor o director ejecuta predicción con `studentId`.
2. Backend agrega métricas académicas + LMS.
3. Servicio ML devuelve score, probabilidad, nivel, factores.
4. Se guarda en `Prediction` y, si riesgo ≥ medio, se crea `Alert`.

## Seguridad

- JWT en cabecera `Authorization: Bearer`.
- Middleware `authenticate` + `authorize(roles)`.
- Alcance de datos: `resolveStudentScope` por rol.
