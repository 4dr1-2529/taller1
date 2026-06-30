# Índice general — Documentación ISO, arquitectura y calidad

**Proyecto:** Tesis Dashboard v2.0  
**Institución:** I.E.P. Blenkir Huancayo · Perú  
**Repositorio:** [github.com/4dr1-2529/taller1](https://github.com/4dr1-2529/taller1)

Este índice centraliza toda la documentación técnica, de calidad (ISO) y de evidencias del sistema web inteligente para la **predicción del riesgo de deserción estudiantil**.

---

## 1. Normas ISO aplicadas

| # | Documento | Descripción breve |
|---|-----------|-------------------|
| 1 | [iso-9001/macroproceso-academico.md](iso-9001/macroproceso-academico.md) | Macroproceso de gestión académica: entradas, procesos, salidas, responsables, KPI y evidencia de implementación en el sistema. Alineación ISO 9001. |
| 2 | [iso-25010/calidad-software.md](iso-25010/calidad-software.md) | Modelo de calidad ISO/IEC 25010 con tabla de evidencias por característica (login, dashboard, IA, roles, notas, alertas, reportes). |
| 3 | [iso-29119/plan-pruebas.md](iso-29119/plan-pruebas.md) | Referencia ISO 29119 — plan operativo en [plan-pruebas/](../plan-pruebas/README.md) (54 casos). |

---

## 2. Arquitectura del sistema

| # | Documento | Descripción breve |
|---|-----------|-------------------|
| 4 | [arquitectura/arquitectura-general.md](arquitectura/arquitectura-general.md) | Visión global del monorepo: capas, flujos de datos, despliegue Vercel + Railway + ML. |
| 5 | [arquitectura/arquitectura-backend.md](arquitectura/arquitectura-backend.md) | Capa API: Express, Prisma, MySQL, JWT, RBAC e integración con IA. |
| 6 | [arquitectura/arquitectura-frontend.md](arquitectura/arquitectura-frontend.md) | Capa presentación: Next.js, dashboards por rol, servicios HTTP. |
| 7 | [arquitectura/arquitectura-ia.md](arquitectura/arquitectura-ia.md) | Capa inteligencia: ensemble RF + XGBoost + Stacking, inferencia y alertas. |
| 8 | [backend/backend-arquitectura.md](backend/backend-arquitectura.md) | Detalle técnico backend: capas, JWT, rutas, Prisma, Railway. |
| 9 | [frontend/frontend-arquitectura.md](frontend/frontend-arquitectura.md) | Detalle técnico frontend: carpetas, componentes, navegación, Vercel. |
| 10 | [python-ia/modelo-predictivo.md](python-ia/modelo-predictivo.md) | Modelo predictivo: flujo completo, métricas, justificación de algoritmos. |

---

## 3. Pruebas y evidencias

| # | Documento / carpeta | Descripción breve |
|---|---------------------|-------------------|
| 11 | [../plan-pruebas/README.md](../plan-pruebas/README.md) | Plan de pruebas operativo (raíz del repo): unitarias, integración, UAT, matriz 54 casos. |
| 12 | [evidencias/README.md](evidencias/README.md) | Guía maestra de evidencias: dónde almacenar capturas, logs y artefactos. |
| 13 | [evidencias/capturas/](evidencias/capturas/README.md) | Capturas generales del sistema web. |
| 14 | [evidencias/backend/](evidencias/backend/README.md) | Logs de tests API, health Railway, Postman backend. |
| 15 | [evidencias/frontend/](evidencias/frontend/README.md) | Lint, build, capturas de vistas y consola sin 401. |
| 16 | [evidencias/dashboard/](evidencias/dashboard/README.md) | KPIs y gráficos por rol (Director, Profesor, Estudiante). |
| 17 | [evidencias/ia/](evidencias/ia/README.md) | metrics.json, matrices, salida `/predict`. |
| 18 | [evidencias/railway/](evidencias/railway/README.md) | Despliegue backend, MySQL, variables, migrate deploy. |
| 19 | [evidencias/vercel/](evidencias/vercel/README.md) | Despliegue frontend, env vars, dominio producción. |
| 20 | [evidencias/github/](evidencias/github/README.md) | Repositorio, commits, estructura monorepo. |
| 21 | [evidencias/postman/](evidencias/postman/README.md) | Colección Postman ejecutada con resultados. |
| 22 | [evidencias/sonarqube/](evidencias/sonarqube/README.md) | Análisis estático: bugs, vulnerabilidades, code smells. |

---

## 4. Documentación operativa existente

| # | Documento | Descripción breve |
|---|-----------|-------------------|
| 23 | [../README.md](../README.md) | README principal del monorepo: instalación, stack, ISO, autores. |
| 24 | [DEPLOY.md](DEPLOY.md) | Guía paso a paso Vercel + Railway, seed, troubleshooting. |
| 25 | [pruebas.md](pruebas.md) | Comandos de test, smoke tests y checklist producción. |
| 26 | [pruebas-funcionales.md](pruebas-funcionales.md) | Casos funcionales automatizados y manuales por rol. |
| 27 | [cuentas-demo/README.md](cuentas-demo/README.md) | CSV verificados de login (660 estudiantes + 23 profesores). |
| 28 | [postman.md](postman.md) | Importación y uso de la colección Postman. |
| 29 | [postman/tesis-dashboard.postman_collection.json](postman/tesis-dashboard.postman_collection.json) | Colección JSON de endpoints API. |

---

## 5. Mapa de navegación rápida

```
docs/
├── INDICE-ISO.md              ← Usted está aquí
├── iso-9001/                  → Gestión de calidad (procesos)
├── iso-25010/                 → Calidad de software (producto)
├── iso-29119/                 → Referencia ISO 29119 (enlace a plan-pruebas/)
├── arquitectura/              → Visión y capas del sistema
├── backend/ · frontend/ · python-ia/  → Detalle por tecnología
├── evidencias/                → Repositorio de capturas y artefactos
├── DEPLOY.md · pruebas*.md

plan-pruebas/                  → Plan de pruebas (raíz del repositorio)
```

---

## 6. URLs de producción

| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | https://taller1-frontend.vercel.app |
| Backend API (Railway) | https://taller1-production.up.railway.app/api/v1 |
| Health check | https://taller1-production.up.railway.app/health |
| GitHub | https://github.com/4dr1-2529/taller1 |

---

## 7. Credenciales demo (pruebas)

Contraseña: **`mbappe29`**

| Rol | Email |
|-----|-------|
| Director | `director@blenkir.edu.pe` |
| Profesor | `pro50000001@blenkir.edu.pe` |
| Estudiante | `mateo.quispe0001@blenkir.edu.pe` |

Listado completo: [cuentas-demo/estudiantes.csv](cuentas-demo/estudiantes.csv), [profesores.csv](cuentas-demo/profesores.csv).
