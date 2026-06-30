# Pruebas caja negra — Dashboard

**Componentes:** `RoleDashboard` (admin), `ProfessorDashboard`, `StudentDashboard`

---

## API por rol

| Rol | Endpoint | Servicio |
|-----|----------|----------|
| admin / docente | `GET /dashboard/kpis` | `dashboard-analytics.service.ts` |
| docente | `GET /profesor/dashboard` | `profesor-dashboard.service.ts` |
| estudiante | `GET /estudiante/dashboard` | `estudiante.controller` |

---

## Casos

| ID | Rol | Verificación | Evidencia |
|----|-----|--------------|-----------|
| TC-CN-02 | admin | KPIs 660 estudiantes, gráficos Recharts | dashboard-director.png |
| TC-UAT-02 | docente | Solo ámbito salones asignados | dashboard-profesor.png |
| TC-UAT-03 | estudiante | `RiskGauge` personal, sin totales globales | dashboard-alumno.png |
| TC-BE-07 | admin | `kpis.byLevel` en JSON | smoke-tests.mjs L106 |
| TC-DASH-05 | todos | 0× HTTP 401 en Network post-login | useAuthReady fix |

---

## Agregación (`dashboard-analytics.service.ts`)

Una consulta agregada — TC-PERF-02 objetivo < 2s local.
