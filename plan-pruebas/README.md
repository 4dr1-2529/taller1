# Plan de pruebas — Tesis Dashboard v2.0

**Norma:** ISO/IEC 29119 · **Casos:** 86 · **Rutas API:** 96 (`routes/index.ts`)

---

## Ejecución QA completa (recomendado)

```bash
# Requiere MySQL + npm run dev (api+web+ml) + db:seed:demo
npm run qa:pipeline
```

Genera evidencias en todas las subcarpetas y [REPORTE-FINAL-PRUEBAS.md](REPORTE-FINAL-PRUEBAS.md).

Scripts: `plan-pruebas/scripts/` (`run-api-tests.mjs`, `run-unit.mjs`, `run-performance.mjs`, `run-capture-ui.mjs`, `run-whitebox.mjs`).

---

## Índice

| Documento | Contenido |
|-----------|-----------|
| [indice-pruebas.md](indice-pruebas.md) | Índice completo |
| [plan-general/plan-pruebas.md](plan-general/plan-pruebas.md) | Plan formal + 77 casos históricos |
| [plan-general/alcance.md](plan-general/alcance.md) | Alcance por capa |
| [plan-general/estrategia.md](plan-general/estrategia.md) | Estrategia ISO 29119 |
| [plan-general/ambiente-pruebas.md](plan-general/ambiente-pruebas.md) | Local :3029/:4000/:5000 |
| [plan-general/riesgos.md](plan-general/riesgos.md) | 12 riesgos con mitigación en código |
| [plan-general/cronograma.md](plan-general/cronograma.md) | 5 fases + secuencia D1–D5 |
| [plan-general/recursos.md](plan-general/recursos.md) | Herramientas, seed 660+23 |
| [matriz-pruebas/matriz-casos.md](matriz-pruebas/matriz-casos.md) | **86 casos** con 12 columnas |
| [matriz-pruebas/matriz-casos.xlsx](matriz-pruebas/matriz-casos.xlsx) | Matriz Excel |
| [REPORTE-FINAL-PRUEBAS.md](REPORTE-FINAL-PRUEBAS.md) | Resumen ejecutivo ejecución real |

---

## Ejecución (del `package.json` real)

```bash
npm run type-check      # shared + frontend + backend
npm run test:backend    # 11 archivos backend/tests/
npm run test:unit       # prediction-format.test.mjs
npm run ml:test         # test_predict.py (6 tests)
npm run test            # los tres anteriores
npm run lint            # frontend ESLint
npm run test:smoke      # smoke-tests.mjs — requiere :4000 y :5000
npm run evidence:generate
```

---

## Cobertura por tipo

| Carpeta | Basado en |
|---------|-----------|
| [pruebas-unitarias/](pruebas-unitarias/) | `backend/tests/`, `test_predict.py`, lint/build |
| [pruebas-caja-negra/](pruebas-caja-negra/) | Vistas UI + `evidencias-finales/` |
| [pruebas-caja-blanca/](pruebas-caja-blanca/) | Zod schemas, scopes, 96 rutas |
| [pruebas-integracion/](pruebas-integracion/) | `smoke-tests.mjs`, `api.ts` |
| [pruebas-seguridad/](pruebas-seguridad/) | `auth.ts`, `permissions.test.mjs` |
| [pruebas-aceptacion/](pruebas-aceptacion/) | UAT 3 roles + `ROLE_SECTIONS` |
| [evidencias-finales/](evidencias-finales/) | Capturas Playwright + logs QA |

---

## Trazabilidad ISO

| Norma | Documento |
|-------|-----------|
| ISO/IEC 25010 | [docs/iso-25010/calidad-software.md](../docs/iso-25010/calidad-software.md) |
| ISO 9001 | [docs/iso-9001/macroproceso-academico.md](../docs/iso-9001/macroproceso-academico.md) |
| ISO/IEC 29119 | [docs/iso-29119/plan-pruebas.md](../docs/iso-29119/plan-pruebas.md) |
| Índice cruzado | [matriz-pruebas/trazabilidad.md](matriz-pruebas/trazabilidad.md) |

---

## Credenciales demo (seed)

`director@blenkir.edu.pe` · `pro50000001@blenkir.edu.pe` · `mateo.quispe0001@blenkir.edu.pe` — password `mbappe29`
