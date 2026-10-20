# Carpeta de evidencias — Guía maestra

**Proyecto:** Tesis Dashboard v2.0  
**Propósito:** Repositorio centralizado de capturas, logs y artefactos para ISO/IEC 29119 e ISO/IEC 25010.

> No almacene datos personales reales ni contraseñas en las evidencias.

---

## Estado de las evidencias (2026-09-26 · revalidado 2026-09-27)

| Conjunto | Significado | Dónde |
|----------|-------------|-------|
| **Vigente — V6** | Auditoría técnica del 2026-09-26 y revalidación del 2026-09-27 (estado de checks, SonarCloud con los 27 issues de `main` — estado de esa fecha; hoy `main` está en Quality Gate OK, verificado 2026-10-20 —, barrido de secretos con clasificación de placeholders corregida, logs de pruebas) | [`sonarqube/`](sonarqube/), [`seguridad/`](seguridad/), [`../../plan-pruebas/evidencias-finales/terminal/`](../../plan-pruebas/evidencias-finales/terminal/) |
| **Histórica — V5 / QA local** | Capturas y ejecuciones anteriores al refresh UI/UX y a los datos definitivos; conservadas sin modificar | `capturas/`, `dashboard/`, `ia/`, `qa/`, `metricas/`, `arquitectura/`, [`../../plan-pruebas/evidencias-finales/`](../../plan-pruebas/evidencias-finales/) |
| **Legacy** | Ejecución anterior al Data Seed definitivo (población demo antigua) | [`../../legacy/`](../../legacy/), [`../evidencias_finales/`](../evidencias_finales/) |

Lectura de estado general: [`../ESTADO_ACTUAL_V6.md`](../ESTADO_ACTUAL_V6.md).

---

## Estructura de carpetas

```
docs/evidencias/
├── README.md           ← Este archivo
├── api/                ← Diagrama del flujo completo de la API (PNG/SVG)
├── arquitectura/       ← Diagramas backend, base de datos y frontend (PNG/SVG)
├── backend/            ← Tests API, health, logs Railway
├── base_datos/         ← DER de Blenkir (PNG/SVG) y README-ER
├── capturas/           ← Pantallas del sistema web
├── dashboard/          ← KPIs y gráficos por rol
├── frontend/           ← Lint, build, consola sin 401
├── github/             ← Repo, commits, releases
├── ia/                 ← metrics.json, matrices, ml:test
├── iso/                ← Diagramas aplicados ISO 25010, ISO 29119 e ISO 9001 (PNG/SVG)
├── metricas/           ← Gráficos ML: curva ROC, matriz de confusión, importancia de variables
├── postman/            ← Colección ejecutada
├── qa/                 ← Salidas de lint, type-check, tests backend/ML y resumen visual
├── railway/            ← Despliegue backend + MySQL
├── seguridad/          ← Barridos de secretos (JSON) y su clasificación
├── sonarqube/          ← Análisis estático calidad código
└── vercel/             ← Despliegue frontend
```

*(Reconteo de carpetas el 2026-10-20: 17 subcarpetas.)*

Varias subcarpetas incluyen su **README.md** con instrucciones específicas (verificado 2026-10-20:
`api/`, `arquitectura/`, `iso/`, `metricas/` y `qa/` no tienen README propio; `base_datos/` usa
`README-ER.md`).

---

## Checklist mínimo (tesis / QA)

- [ ] Login Director, Profesor, Estudiante → `capturas/login/`
- [ ] Dashboard por rol → `dashboard/`
- [ ] Tests backend pass → `backend/`
- [ ] Build + lint frontend → `frontend/`
- [ ] metrics.json post-train → `ia/`
- [ ] Health Railway 200 → `railway/`
- [ ] Vercel deploy activo → `vercel/`
- [ ] Repo GitHub actualizado → `github/`
- [ ] Postman ejecutado → `postman/`
- [ ] SonarQube (si aplica) → `sonarqube/`

---

## Convención de nombres

```
[modulo]-[descripcion]-[YYYY-MM-DD].[ext]
```

Ejemplo: `dashboard-director-kpis-2026-06-04.png`

---

## Referencias

- [Plan de pruebas ISO 29119](../iso-29119/plan-pruebas.md)
- [Calidad ISO 25010](../iso-25010/calidad-software.md)
- [Índice documentación](../INDICE-ISO.md)
