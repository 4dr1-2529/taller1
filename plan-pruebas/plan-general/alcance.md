# Alcance del plan de pruebas

**Referencia:** [plan-pruebas.md](plan-pruebas.md) · Sección 2

---

## Componentes incluidos (código verificado)

| Capa | Ruta / archivo | Alcance pruebas |
|------|----------------|-----------------|
| API | `backend/src/routes/index.ts` | 87 endpoints documentados en `pruebas-caja-blanca/api.md` |
| Backend tests | `backend/tests/` | 11 suites — ver `pruebas-unitarias/backend.md` |
| Frontend | `frontend/src/data/role-sections.ts` | `ROLE_SECTIONS` 20/15/12 secciones |
| BD | `backend/prisma/schema.prisma` | 57 modelos Prisma (54 activos + 3 legacy `@@ignore`); BD de pruebas aislada `127.0.0.1:33316` |
| ML | `machine-learning/` | FastAPI :5000, 32 pruebas en `tests/test_predict.py`, artefactos V6 en `artifacts/synthetic/` |

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
