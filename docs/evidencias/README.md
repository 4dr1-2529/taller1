# Carpeta de evidencias — Guía maestra

**Proyecto:** Tesis Dashboard v2.0  
**Propósito:** Repositorio centralizado de capturas, logs y artefactos para ISO/IEC 29119 e ISO/IEC 25010.

> No almacene datos personales reales ni contraseñas en las evidencias.

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
