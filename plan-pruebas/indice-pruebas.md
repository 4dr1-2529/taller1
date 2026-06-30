# Índice del plan de pruebas — ISO/IEC 29119

**77 casos** · **87 rutas API** · **11 suites backend** · **7 tests ML**

---

## plan-general/

| Archivo | ISO 29119 fase |
|---------|----------------|
| [plan-pruebas.md](plan-general/plan-pruebas.md) | Plan de pruebas (objetivo, 54 casos históricos + enlace matriz 77) |
| [alcance.md](plan-general/alcance.md) | Alcance |
| [estrategia.md](plan-general/estrategia.md) | Estrategia |
| [ambiente-pruebas.md](plan-general/ambiente-pruebas.md) | Ambiente |
| [riesgos.md](plan-general/riesgos.md) | Análisis de riesgos |
| [cronograma.md](plan-general/cronograma.md) | Cronograma D1–D5 |
| [recursos.md](plan-general/recursos.md) | Recursos humanos y herramientas |

## pruebas-unitarias/

| Archivo | Fuente código |
|---------|---------------|
| [backend.md](pruebas-unitarias/backend.md) | `backend/tests/` (11 archivos) |
| [frontend.md](pruebas-unitarias/frontend.md) | `ROLE_SECTIONS`, lint, build |
| [ia.md](pruebas-unitarias/ia.md) | `test_predict.py`, `train.py` |
| [controladores.md](pruebas-unitarias/controladores.md) | `controllers/*.ts` |
| [servicios.md](pruebas-unitarias/servicios.md) | `services/*.ts` |

## pruebas-caja-negra/

login · dashboard · [usuarios.md](pruebas-caja-negra/usuarios.md) · [profesores.md](pruebas-caja-negra/profesores.md) · [cursos.md](pruebas-caja-negra/cursos.md) · notas · predicción · [alertas.md](pruebas-caja-negra/alertas.md) · reportes · [configuracion.md](pruebas-caja-negra/configuracion.md)

## pruebas-caja-blanca/

backend · [api.md](pruebas-caja-blanca/api.md) · controladores · servicios

## pruebas-integracion/

frontend-backend · backend-bd · backend-ia · ia-dashboard

## pruebas-rendimiento/ · pruebas-seguridad/ · pruebas-aceptacion/

Ver subcarpetas — cada archivo referencia rutas y tests reales.

## matriz-pruebas/

| [matriz-casos.md](matriz-pruebas/matriz-casos.md) | **77 filas** con ID, Módulo, Objetivo, Entrada, Esperado, Obtenido, Estado, Prioridad |
| [matriz-casos.xlsx](matriz-pruebas/matriz-casos.xlsx) | Excel generado por `generate_matriz.py` |
| [trazabilidad.md](matriz-pruebas/trazabilidad.md) | Requisito ↔ código ↔ evidencia |

## evidencias-finales/

Capturas Playwright reales en `plan-pruebas/evidencias-finales/` (11 módulos + `ia/` + `resultados/`). Ver [README](../evidencias-finales/README.md).
