# Carpeta de evidencias — Guía maestra

**Proyecto:** Tesis Dashboard v2.0  
**Propósito:** Repositorio centralizado de capturas, logs y artefactos para ISO/IEC 29119 e ISO/IEC 25010.

> No almacene datos personales reales ni contraseñas en las evidencias.

---

## Estado de las evidencias (2026-09-26)

| Conjunto | Significado | Dónde |
|----------|-------------|-------|
| **Vigente — V6** | Auditoría técnica del 2026-09-26: estado de checks, SonarCloud, barrido de secretos, logs de pruebas | [`sonarqube/`](sonarqube/), [`seguridad/`](seguridad/), [`../../plan-pruebas/evidencias-finales/terminal/`](../../plan-pruebas/evidencias-finales/terminal/) |
| **Histórica — V5 / QA local** | Capturas y ejecuciones anteriores al refresh UI/UX y a los datos definitivos; conservadas sin modificar | `capturas/`, `dashboard/`, `ia/`, `qa/`, `metricas/`, `arquitectura/`, [`../../plan-pruebas/evidencias-finales/`](../../plan-pruebas/evidencias-finales/) |
| **Legacy** | Ejecución anterior al Data Seed definitivo (población demo antigua) | [`../../legacy/`](../../legacy/), [`../evidencias_finales/`](../evidencias_finales/) |

Lectura de estado general: [`../ESTADO_ACTUAL_V6.md`](../ESTADO_ACTUAL_V6.md).

---

## Estructura de carpetas

```
docs/evidencias/
├── README.md           ← Este archivo
├── capturas/           ← Pantallas del sistema web
├── backend/            ← Tests API, health, logs Railway
├── frontend/           ← Lint, build, consola sin 401
├── dashboard/          ← KPIs y gráficos por rol
├── ia/                 ← metrics.json, matrices, ml:test
├── railway/            ← Despliegue backend + MySQL
├── vercel/             ← Despliegue frontend
├── github/             ← Repo, commits, releases
├── postman/            ← Colección ejecutada
└── sonarqube/          ← Análisis estático calidad código
```

Cada subcarpeta tiene su **README.md** con instrucciones específicas.

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
