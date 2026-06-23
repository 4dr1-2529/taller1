# Plan de pruebas — Índice operativo

Carpeta de apoyo al **Plan de Pruebas formal ISO/IEC 29119**.

---

## Documento principal

El plan completo (**54 casos de prueba**) está en:

**[docs/iso-29119/plan-pruebas.md](../iso-29119/plan-pruebas.md)**

Incluye objetivo, alcance, casos de prueba, criterios de aceptación y secciones por módulo (backend, frontend, IA, roles, notas, dashboard, alertas).

---

## Documentos relacionados

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| Pruebas funcionales | [../pruebas-funcionales.md](../pruebas-funcionales.md) | Comandos y casos unitarios |
| Pruebas y smoke | [../pruebas.md](../pruebas.md) | Checklist producción |
| Calidad ISO 25010 | [../iso-25010/calidad-software.md](../iso-25010/calidad-software.md) | Características de calidad |
| Macroproceso ISO 9001 | [../iso-9001/macroproceso-academico.md](../iso-9001/macroproceso-academico.md) | KPI e indicadores |
| Evidencias | [../evidencias/README.md](../evidencias/README.md) | Dónde guardar capturas y resultados |
| Postman | [../postman.md](../postman.md) | Colección API |

---

## Ejecución rápida

```bash
# Desde tesis-dashboard/
npm run type-check
npm run test:backend
npm run ml:test
npm run lint
npm run build
npm run test:smoke    # Requiere servicios en ejecución
```

---

## Matriz de trazabilidad (resumen)

| Requisito | Casos | Evidencia |
|-----------|-------|-----------|
| Auth multirol | TC-AUTH-*, TC-ROL-* | `evidencias/pruebas/` |
| Notas bimestre | TC-NOT-* | `evidencias/capturas-sistema/` |
| Predicción IA | TC-ML-* | `evidencias/resultados-ml/` |
| Dashboard KPIs | TC-DASH-* | `evidencias/capturas-sistema/director/` |
| Alertas | TC-ALT-* | `evidencias/capturas-sistema/alertas/` |
| Despliegue | CA-GEN-05 | `evidencias/railway/`, `evidencias/vercel/` |

---

## Plantillas sugeridas (crear al ejecutar pruebas)

Puede añadir en esta carpeta:

- `matriz-trazabilidad.csv` — Requisito ↔ Caso ↔ Resultado
- `informe-ejecucion-YYYY-MM-DD.md` — Resumen de una ronda de pruebas
- `defectos-YYYY-MM-DD.md` — Registro de incidencias encontradas
