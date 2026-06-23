# Macroproceso de gestión académica — ISO 9001

**Sistema:** Tesis Dashboard v2.0  
**Institución:** I.E.P. Blenkir Huancayo · Perú  
**Norma de referencia:** ISO 9001:2015 — Sistemas de gestión de la calidad  
**Versión:** 2.0

---

## 1. Propósito

Documentar el **macroproceso de gestión académica** del I.E.P. Blenkir implementado en el sistema web inteligente de predicción de deserción, demostrando trazabilidad entre requisitos ISO 9001 y funcionalidades reales del software.

---

## 2. Diagrama del proceso

### 2.1 Diagrama Mermaid (macroproceso completo)

```mermaid
flowchart TB
  subgraph ENTRADAS["ENTRADAS"]
    E1[Datos académicos<br/>estudiantes, matrículas, notas]
    E2[Datos LMS<br/>acceso, tareas, foros]
    E3[Asistencia y bimestres]
    E4[Asignación docente<br/>tutor / polidocencia]
  end

  subgraph PROCESOS["PROCESOS"]
    P1[Limpieza y validación<br/>Zod + RBAC]
    P2[Integración BD<br/>Prisma + MySQL]
    P3[Feature engineering<br/>10 variables tesis]
    P4[Predicción ensemble IA<br/>RF + XGBoost + Stacking]
    P5[Generación alertas<br/>nueva → seguimiento → resuelta]
  end

  subgraph SALIDAS["SALIDAS"]
    S1[Dashboard por rol]
    S2[Reportes PDF/Excel]
    S3[Alertas tempranas]
    S4[Decisiones pedagógicas]
  end

  ENTRADAS --> P1 --> P2 --> P3 --> P4 --> P5 --> SALIDAS

  CI1[Director] -.-> E1
  CI2[Profesor] -.-> E2
  CI3[Sistema IA] -.-> P4
  CO1[Director] -.-> S1
  CO2[Profesor] -.-> S3
  CO3[Estudiante] -.-> S1
```

### 2.2 Diagrama ASCII (vista simplificada)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ENTRADAS                                       │
│  Académicos │ LMS │ Asistencia │ Matrículas │ Asignación docente        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           PROCESOS                                       │
│  Validar → Persistir → Extraer features → Predecir IA → Crear alertas   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SALIDAS                                        │
│  Dashboard │ Reportes │ Alertas │ Historial predicciones │ Mensajería   │
└─────────────────────────────────────────────────────────────────────────┘
         ▲                    ▲                         ▲
    Director            Profesor                  Estudiante
```

---

## 3. Entradas

| ID | Entrada | Origen | Formato | Responsable registro |
|----|---------|--------|---------|---------------------|
| EN-01 | Ficha estudiante (nombre, DNI, sección) | Gestión institucional | Formulario web / API | Director |
| EN-02 | Matrícula año lectivo + sección | Secretaría / Director | `POST /matriculas` | Director |
| EN-03 | Notas por curso y bimestre (0–20) | Evaluación docente | `POST /grades`, `/profesor/notas` | Profesor |
| EN-04 | Asistencia diaria / porcentual | Aula | `POST /attendance` | Profesor |
| EN-05 | Actividad LMS (accesos, tareas, foros) | Plataforma virtual | Tablas `lms_*` / seed | Sistema + Profesor |
| EN-06 | Asignación tutor 1°–2° | Dirección | `POST /teacher-assignments/tutor` | Director |
| EN-07 | Polidocencia 3°–6° | Dirección | `POST /teacher-assignments` | Director |
| EN-08 | Credenciales de acceso | Admin usuarios | `usuario.email` + bcrypt | Director |

**Requisitos ISO 9001 sobre entradas (7.5 — Información documentada):**

- Datos identificables y trazables por `studentId` y año lectivo.
- Validación de rangos antes de persistir (notas, asistencia).
- Bimestres I–II completos para predicción temprana.

---

## 4. Procesos

| ID | Proceso | Descripción | Componente sistema |
|----|---------|-------------|-------------------|
| PR-01 | **Recepción y validación** | Verificar integridad y rangos de datos entrantes | Express + Zod validators |
| PR-02 | **Limpieza / normalización** | Coerción numérica, sanitización XSS, rechazo IDs ajenos | `grades.controller`, `student-scope` |
| PR-03 | **Almacenamiento** | Persistencia relacional transaccional | Prisma ORM → MySQL 8 |
| PR-04 | **Control de acceso** | Filtrar datos por rol (Director / Profesor / Estudiante) | `authorize()`, `teacher-scope` |
| PR-05 | **Extracción de features** | Consolidar 10 variables para ML | `predict.controller` + queries Prisma |
| PR-06 | **Predicción IA** | Clasificar riesgo bajo/medio/alto | FastAPI `/predict` — ensemble |
| PR-07 | **Generación de alertas** | Crear alerta si riesgo ≥ umbral | Servicio predict → tabla `alert` |
| PR-08 | **Visualización** | Presentar KPIs y detalle por rol | Next.js dashboards |
| PR-09 | **Reportes** | Exportar información para decisión | `ReportsView`, jsPDF, xlsx |
| PR-10 | **Auditoría** | Registrar acciones críticas del Director | `audit_log` |

---

## 5. Salidas

| ID | Salida | Destinatario | Canal / endpoint |
|----|--------|--------------|------------------|
| SA-01 | Dashboard institucional (KPIs) | Director | `RoleDashboard`, `GET /dashboard/kpis` |
| SA-02 | Dashboard docente (ámbito propio) | Profesor | `ProfessorDashboard`, `/profesor/dashboard` |
| SA-03 | Dashboard personal + gauge riesgo | Estudiante | `StudentDashboard`, `/estudiante/dashboard` |
| SA-04 | Listado estudiantes en riesgo | Director / Profesor | Predicciones + alertas |
| SA-05 | Alertas tempranas | Director / Profesor / Estudiante | `/alerts`, `/profesor/alertas`, `/estudiante/alertas` |
| SA-06 | Reportes exportables | Director | `ReportsView`, `POST /reports` |
| SA-07 | Historial de predicciones | Director / Profesor | `/predictions`, `/profesor/historial-predicciones` |
| SA-08 | Recomendación pedagógica IA | Todos (según rol) | Campo `recomendacion` en respuesta predict |
| SA-09 | Comunicados académicos | Comunidad educativa | `/messages` |
| SA-10 | Trazabilidad de gestión | Director | `/admin/audit-logs` |

---

## 6. Clientes internos

| Cliente interno | Necesidad satisfecha | Salida que consume |
|-----------------|---------------------|-------------------|
| **Director** | Visión global, toma de decisiones institucionales | Dashboard KPIs, reportes, alertas globales, CRUD |
| **Profesor** | Seguimiento de su aula y registro académico | Notas, asistencia, LMS, predicción acotada, alertas propias |
| **Estudiante** | Autoconocimiento de desempeño y riesgo | Notas propias, asistencia, LMS, predicción personal |
| **Sistema IA** | Datos limpios y features consistentes | Entradas EN-03 a EN-05 vía backend |
| **Equipo de calidad (QA)** | Evidencias de cumplimiento ISO | `docs/evidencias/`, plan de pruebas 29119 |

---

## 7. Responsables

| Rol | Responsabilidad en el macroproceso | Herramienta |
|-----|-----------------------------------|-------------|
| **Director** | Gobierno del proceso, datos maestros, asignaciones, reportes | UI rol `admin` |
| **Profesor** | Captura operativa (notas, asistencia, LMS), seguimiento alertas | UI rol `docente` |
| **Estudiante** | Consulta de resultados personales (no gestiona el proceso) | UI rol `estudiante` |
| **Sistema IA** | Predicción objetiva, factores explicables, recomendación | `machine-learning/` |
| **Administrador técnico** | Despliegue, BD, migraciones, seed | Railway + Vercel |

---

## 8. Indicadores KPI

| KPI | Fórmula / definición | Meta | Fuente de medición |
|-----|---------------------|------|-------------------|
| **KPI-01** Estudiantes en riesgo | Count(`nivel_riesgo` ∈ {medio, alto}) | Identificar 100 % casos predichos | `/dashboard/kpis` |
| **KPI-02** Alertas generadas | Count(`alert.estado` = nueva + en_seguimiento) | 1 alerta por predicción medio/alto | `/alerts` |
| **KPI-03** Notas registradas | Notas bimestre I–II / (estudiantes × cursos) | ≥ 95 % cobertura | `validate-demo-data.mjs` |
| **KPI-04** Alertas resueltas | Resueltas / total alertas × 100 | Seguimiento documentado | PATCH `/alerts/:id` |
| **KPI-05** Disponibilidad API | Uptime `/health` | ≥ 99 % mensual | Railway monitoring |
| **KPI-06** F1 del modelo IA | F1-Score weighted en test set | ≥ 0.80 | `metrics.json` |
| **KPI-07** Tiempo respuesta predict | ms POST `/predict` | < 3000 ms | Smoke tests |
| **KPI-08** Cobertura docente | Salones con tutor/asignación | 22/22 secciones | `/teacher-assignments` |

---

## 9. Relación con ISO 9001

| Cláusula ISO 9001:2015 | Aplicación en el sistema |
|------------------------|--------------------------|
| **4.4 Sistema de gestión de la calidad** | Macroproceso documentado + indicadores KPI |
| **6.2 Objetivos de calidad** | KPI-01 a KPI-08 medibles en dashboard y métricas ML |
| **7.1.5 Recursos de seguimiento** | Tests automatizados, health checks, audit log |
| **7.5 Información documentada** | `docs/`, CHANGELOG, plan de pruebas, evidencias |
| **8.1 Planificación y control operacional** | Seed demo, repair, validación datos |
| **8.5 Producción y provisión del servicio** | Flujo entradas → procesos → salidas |
| **9.1 Seguimiento, medición, análisis** | KPIs, métricas ML, SonarQube |
| **10.2 No conformidad y acción correctiva** | Alertas + estados + recomendaciones IA |

---

## 10. Evidencia: implementación por etapa

| Etapa | Evidencia en el sistema | Archivo / ruta |
|-------|------------------------|----------------|
| **Entrada académica** | CRUD estudiantes, matrículas | `StudentsView`, `POST /students`, `POST /matriculas` |
| **Entrada evaluación** | Registro notas 0–20 | `GradesView`, `grades.controller.ts` |
| **Entrada LMS** | Vista actividad plataforma | `LMSView`, tablas `lms_activity` |
| **Validación** | Schemas Zod rechazan datos inválidos | `backend/tests/schemas.test.ts` |
| **Persistencia** | 51 tablas MySQL | `prisma/schema.prisma` |
| **RBAC** | 403 en endpoints no autorizados | `permissions.test.mjs` |
| **Predicción** | POST `/predict` → nivel + factores | `predict.controller.ts`, `ml-client.ts` |
| **Alertas** | Tabla `alert`, estados enum | `AlertsView`, `alerts.controller.ts` |
| **Dashboard** | KPIs por rol sin 401 | `RoleDashboard`, `useAuthReady` |
| **Reportes** | Export PDF/Excel | `ReportsView` |
| **Auditoría** | Log acciones admin | `GET /admin/audit-logs` |
| **Evidencias QA** | Capturas y logs | `docs/evidencias/` |

---

## 11. Referencias

- [ISO 25010 — Calidad de software](../iso-25010/calidad-software.md)
- [ISO 29119 — Plan de pruebas](../iso-29119/plan-pruebas.md)
- [Arquitectura general](../arquitectura/arquitectura-general.md)
- [Evidencias](../evidencias/README.md)
