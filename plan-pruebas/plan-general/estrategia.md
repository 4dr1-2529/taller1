# Estrategia de pruebas

**Norma:** ISO/IEC 29119 · **Proyecto:** Tesis Dashboard v2.0

---

## Enfoque por capas

| Nivel | Tipo | Carpeta | Herramientas |
|-------|------|---------|--------------|
| 1 | Unitarias | `pruebas-unitarias/` | Jest, pytest, Vitest |
| 2 | Caja blanca | `pruebas-caja-blanca/` | Revisión código, Postman |
| 3 | Caja negra | `pruebas-caja-negra/` | Playwright, manual |
| 4 | Integración | `pruebas-integracion/` | Smoke tests, API |
| 5 | Seguridad | `pruebas-seguridad/` | Tests RBAC, JWT |
| 6 | Rendimiento | `pruebas-rendimiento/` | Mediciones manuales |
| 7 | Aceptación | `pruebas-aceptacion/` | UAT por rol |

---

## Criterios de entrada

- Código en rama `main` estable
- `npm run type-check` sin errores
- BD local con seed demo (`npm run db:seed:demo`)
- Modelo ML entrenado (`npm run ml:train`) para pruebas IA

---

## Criterios de salida

| ID | Criterio |
|----|----------|
| CA-01 | 100 % pass `npm run test:backend` |
| CA-02 | 0 errores `npm run type-check` |
| CA-03 | `npm run build` exitoso |
| CA-04 | `npm run lint` sin errores |
| CA-05 | Health prod HTTP 200 |
| CA-06 | Login 3 roles sin 401 en consola |

---

## Priorización

1. **Crítico:** Auth, RBAC, predicción, notas
2. **Alto:** Dashboard, alertas, integración ML
3. **Medio:** Reportes, exportaciones
4. **Bajo:** Rendimiento bajo carga extrema

---

## Evidencias

Toda ejecución documentada en [matriz-pruebas/trazabilidad.md](../matriz-pruebas/trazabilidad.md) y artefactos en [evidencias-finales/](../evidencias-finales/).
