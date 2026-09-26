# Plan de pruebas — Tesis Dashboard v2.0

**Norma:** ISO/IEC 29119 · **Casos:** 86 (80 aprobados · 6 observados · 0 fallidos) · **Rutas API:** 109 en `routes/index.ts` (+3 `app.get` = 112 handlers; 82 con `authorize()`)

> **Ejecución verificada 2026-09-26:** `type-check` 0 · `lint` 0 · unit 4/4 · frontend 40/40 ·
> backend 81/81 · ML 32/32 · `build` correcto · integración 39/39 en BD aislada · `test:smoke` **NO
> DISPONIBLE** (faltan `*_INITIAL_PASSWORD`). Detalle: [`../docs/ESTADO_ACTUAL_V6.md`](../docs/ESTADO_ACTUAL_V6.md).

---

## Ejecución QA completa (recomendado)

```bash
# Requiere MySQL + npm run dev (api+web+ml). db:seed:demo esta deshabilitado (legacy).
npm run qa:pipeline
```

Genera evidencias en todas las subcarpetas y [REPORTE-FINAL-PRUEBAS.md](REPORTE-FINAL-PRUEBAS.md).

Scripts: `plan-pruebas/scripts/` (`run-api-tests.mjs`, `run-unit.mjs`, `run-performance.mjs`, `run-capture-ui.mjs`, `run-whitebox.mjs`).

---

## Índice

| Documento | Contenido |
|-----------|-----------|
| [indice-pruebas.md](indice-pruebas.md) | Índice completo |
| [plan-general/plan-pruebas.md](plan-general/plan-pruebas.md) | Plan formal (su matriz histórica quedó superada por los 86 casos vigentes) |
| [plan-general/alcance.md](plan-general/alcance.md) | Alcance por capa |
| [plan-general/estrategia.md](plan-general/estrategia.md) | Estrategia ISO 29119 |
| [plan-general/ambiente-pruebas.md](plan-general/ambiente-pruebas.md) | Local :3029/:4000/:5000 |
| [plan-general/riesgos.md](plan-general/riesgos.md) | 12 riesgos con mitigación en código |
| [plan-general/cronograma.md](plan-general/cronograma.md) | 5 fases + secuencia D1–D5 |
| [plan-general/recursos.md](plan-general/recursos.md) | Herramientas y entorno de pruebas |
| [matriz-pruebas/matriz-casos.md](matriz-pruebas/matriz-casos.md) | **86 casos** con 12 columnas |
| [matriz-pruebas/matriz-casos.xlsx](matriz-pruebas/matriz-casos.xlsx) | Matriz Excel |
| [REPORTE-FINAL-PRUEBAS.md](REPORTE-FINAL-PRUEBAS.md) | Resumen ejecutivo ejecución real |

---

## Ejecución (del `package.json` real)

```bash
npm run type-check      # shared + frontend + backend
npm run test:backend    # 14 archivos backend/tests/ (81 pruebas: 49 .mjs + 32 .ts)
npm run test:unit       # prediction-format.test.mjs
npm run ml:test         # test_predict.py (32 pruebas)
npm run test            # los tres anteriores
npm run lint            # frontend ESLint
npm run test:smoke      # smoke-tests.mjs — requiere :4000, :5000 y *_INITIAL_PASSWORD (NO DISPONIBLE)
npm run evidence:generate
```

---

## Cobertura por tipo

| Carpeta | Basado en |
|---------|-----------|
| [pruebas-unitarias/](pruebas-unitarias/) | `backend/tests/`, `test_predict.py`, lint/build |
| [pruebas-caja-negra/](pruebas-caja-negra/) | Vistas UI + `evidencias-finales/` |
| [pruebas-caja-blanca/](pruebas-caja-blanca/) | Zod schemas, scopes, 109 rutas |
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

## Credenciales (variables de entorno)

`director@blenkir.edu.pe` · `prof001@blenkir.edu.pe` · `est0002@alumnos.blenkir.edu.pe` —
contraseñas en las variables de entorno `DIRECTOR_INITIAL_PASSWORD`, `TEACHER_INITIAL_PASSWORD`
y `STUDENT_INITIAL_PASSWORD`. No se publican valores.

Si esas variables no están cargadas en el proceso, `npm run test:smoke` termina con exit 1 y el mensaje
`Faltan variables de contraseña` (comportamiento observado el 2026-09-26): es una limitación del
entorno, no un fallo del sistema. Los scripts de población legacy están deshabilitados.
