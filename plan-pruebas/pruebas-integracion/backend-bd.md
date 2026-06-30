# Pruebas de integración — Backend ↔ Base de datos

**ORM:** Prisma 6 · **BD:** MySQL `tesis_dashboard`

---

## Casos TC-DB-*

| ID | Verificación |
|----|--------------|
| TC-DB-01 | `prisma migrate deploy` sin P3009 |
| TC-DB-02 | Seed estructura (grados, cursos) |
| TC-DB-03 | 660 estudiantes demo |
| TC-DB-04 | validate-demo-data.mjs |
| TC-DB-05 | 23 profesores activos |
| TC-DB-06 | Bimestres III–IV vacíos |

---

## Comandos

```bash
npm run db:push
npm run db:seed
npm run db:seed:demo
node backend/scripts/validate-demo-data.mjs
```

---

## Evidencias

Diagrama ER: [docs/evidencias_finales/base_datos/](../../docs/evidencias_finales/base_datos/)
