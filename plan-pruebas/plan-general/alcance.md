# Alcance del plan de pruebas

**Referencia:** [plan-pruebas.md](plan-pruebas.md) · Sección 2

---

## Componentes incluidos (código verificado)

| Capa | Ruta / archivo | Alcance pruebas |
|------|----------------|-----------------|
| API | `backend/src/routes/index.ts` | 87 endpoints documentados en `pruebas-caja-blanca/api.md` |
| Backend tests | `backend/tests/` | 11 suites — ver `pruebas-unitarias/backend.md` |
| Frontend | `frontend/src/app/(shell)/page.tsx` | `ROLE_SECTIONS` 14/10/6 secciones |
| BD | `backend/prisma/schema.prisma` | 52 modelos, seed 660+23 |
| ML | `machine-learning/` | FastAPI :5000, 7 pytest, `best_model.joblib` |

---

## Funcionalidades cubiertas

- Autenticación multirol
- Dashboard KPIs (Director, Profesor, Estudiante)
- Gestión estudiantes, profesores, cursos, asignaciones
- Registro de notas (bimestres I y II)
- Predicción de riesgo y alertas tempranas
- Reportes (Excel/PDF)
- Integración Backend ↔ ML

---

## Fuera de alcance (v1)

- Pruebas de estrés masivo (>1000 usuarios concurrentes)
- Penetration testing externo
- Compatibilidad navegadores legacy (IE11)

---

## Entornos

| Entorno | Uso |
|---------|-----|
| **Local** | Desarrollo, evidencias, `npm run dev` |
| **Producción** | Vercel + Railway (validación smoke post-despliegue) |

Ver [ambiente-pruebas.md](ambiente-pruebas.md).
