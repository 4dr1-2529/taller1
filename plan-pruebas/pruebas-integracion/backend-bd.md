# Pruebas de integración — Backend ↔ Base de datos

**ORM:** Prisma 6 · **BD:** MySQL `tesis_dashboard`

---

## Casos TC-DB-*

| ID | Verificación |
|----|--------------|
| TC-DB-01 | `npm run db:count-models` → 57 modelos (54 activos + 3 `@@ignore`) |
| TC-DB-02 | Seed estructura (`npm run db:seed`) — grados, cursos, catálogos |
| TC-DB-03 | `npm run db:seed:demo` rechazado por `legacy-population-disabled.mjs` (exit 1, BD intacta) |
| TC-DB-04 | `GET /teachers` → lista paginada (observado: captura histórica) |
| TC-DB-05 | Períodos académicos 2026 en BD aislada (39/39 integration) |
| TC-DB-06 | `POST /matriculas` → HTTP 201 con `item.id` persistido en BD aislada |

---

## Comandos

```bash
npm run db:migrate:deploy   # esquema sin drift (nunca db push en producción)
npm run db:seed              # estructura
npm run db:count-models      # 57 modelos
npm run test:integration     # 39/39 en BD aislada 127.0.0.1:33316
# npm run db:seed:demo       # DESHABILITADO (legacy-population-disabled.mjs)
```

---

## Evidencias

Diagrama ER: [docs/evidencias_finales/base_datos/](../../docs/evidencias_finales/base_datos/)
