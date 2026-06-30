# Estado del Arte — Dashboard (Learning Analytics / Visualización por Rol)

**Tecnologías implementadas:** `RoleDashboard`, `StudentDashboard`, Recharts, KPIs de alertas, 14/10/6 secciones por rol.

**Evidencia:** `frontend/src/app/(shell)/page.tsx`, `frontend/src/components/dashboard/`, `frontend/src/lib/aggregates.ts`.

---

## Introducción

El dashboard de Tesis Dashboard agrega indicadores académicos, predicciones ML y alertas en vistas diferenciadas para **director (admin)**, **docente** y **estudiante**. No es un panel estático: cada rol accede solo a las secciones definidas en `ROLE_SECTIONS` y los componentes cargan datos en tiempo real desde la API REST.

---

## Problema

Los sistemas de alerta temprana fallan cuando:

- Presentan demasiada información irrelevante al rol equivocado.
- No conectan predicciones ML con acciones (alertas, mensajería).
- Carecen de KPIs interpretables para decisión pedagógica.
- No siguen principios de diseño de Learning Analytics Dashboards (LAD).

El proyecto debe demostrar que su dashboard responde a evidencia de diseño LAD y EWS (Early Warning Systems) publicada recientemente.

---

## Artículo 1

**Referencia:** Paulsen, C. A., & Lindsay, E. K. (2024). Learning analytics dashboards (LADs): a systematic review of the literature. *Education and Information Technologies*, 29, 4275–4305.  
**DOI:** [10.1007/s10639-023-12401-4](https://doi.org/10.1007/s10639-023-12401-4)

### Aporte

Sistematiza 66 LADs: tipos de visualización, audiencias (estudiante, docente, administrador) y gap entre datos y acción pedagógica.

### Comparación

| Principio LAD | Implementación |
|---------------|----------------|
| Audiencia múltiple | `ROLE_SECTIONS` admin/docente/estudiante |
| KPIs | `RoleDashboard`, contadores alertas |
| Acción | Enlace a `AlertsView`, `MensajeriaAcademicaView` |

### Aplicación al proyecto

`page.tsx` L54–90 define tres perfiles de navegación. Admin ve 14 secciones incluyendo Reportes y Matrículas; estudiante solo 6 (Dashboard, Notas, Asistencia, LMS, Predicción, Mensajería) — exactamente el principio de personalización por audiencia del artículo.

---

## Artículo 2

**Referencia:** Masiello, I., et al. (2024). Learning Analytics Dashboards: A Systematic Review of the Literature. *Education Sciences*, 14(1), 82.  
**DOI:** [10.3390/educsci14010082](https://doi.org/10.3390/educsci14010082)

### Aporte

Clasifica LADs por propósito (monitoreo, predicción, intervención) y destaca necesidad de feedback loops entre dashboard y acciones institucionales.

### Comparación

| Tipo LAD | Módulo proyecto |
|----------|-----------------|
| Monitoreo | `AttendanceView`, `LMSView` |
| Predicción | `PredictionView`, `PredictionHistoryView` |
| Intervención | `AlertsView`, `ProfessorAlertsView` |

### Aplicación al proyecto

El flujo alerta → mensajería (`MensajeriaAcademicaView`) cierra el loop que el artículo identifica como frecuentemente ausente. `earlyAlertCount` en `aggregates.ts` alimenta badges de alertas en el shell de navegación.

---

## Artículo 3

**Referencia:** Kaliisa, R., et al. (2023). Development of a learning analytics dashboard checklist. *International Journal of Educational Technology in Higher Education*, 20, 53.  
**DOI:** [10.1186/s41239-023-00394-6](https://doi.org/10.1186/s41239-023-00394-6)

### Aporte

Propone checklist de calidad para LAD: claridad visual, adaptación al rol, datos actualizados y usabilidad.

### Comparación

| Criterio checklist | Evidencia código |
|--------------------|------------------|
| Rol-adaptado | `RoleDashboard` vs `StudentDashboard` |
| Datos actuales | Hooks `useAcademicData`, `useProfessorStructure` |
| Estados vacíos | `EmptyState`, `CardSkeleton` |
| Exportación | `ReportsView` + jsPDF/xlsx |

### Aplicación al proyecto

`RoleDashboard.tsx` y `StudentDashboard.tsx` son implementaciones distintas, no un único dashboard filtrado — cumpliendo el criterio de adaptación al rol del checklist. Skeletons en `page.tsx` mejoran percepción de carga durante fetch a API.

---

## Artículo 4

**Referencia:** Pan, X., et al. (2024). A systematic review of learning analytics in learning management systems. *Journal of Learning Analytics*, 11(1), 126–154.  
**DOI:** [10.18608/jla.2023.8093](https://doi.org/10.18608/jla.2023.8093)

### Aporte

Revisa integración LMS–analytics; recomienda combinar logs de plataforma con rendimiento académico en dashboards unificados.

### Comparación

| Fuente datos | Vista proyecto |
|--------------|----------------|
| LMS logs | `LMSView`, `StudentLMSView`, `ProfessorLMSView` |
| Rendimiento | `GradesView`, notas API |
| Riesgo integrado | `PredictionView` con features LMS |

### Aplicación al proyecto

Variables ML `frecuencia_acceso_lms`, `tiempo_plataforma`, `uso_foros` provienen del módulo LMS del backend y se visualizan antes de ejecutar predicción — implementación del modelo LMS+grades que el artículo sistematiza.

---

## Artículo 5

**Referencia:** Bañeres, D., et al. (2025). EarlySTEM: Machine Learning Platform for Early Identification of Dropout Risk in STEM Programs. *IEEE Global Engineering Education Conference (EDUCON)*.  
**DOI:** [10.1109/C366505.2025.11339990](https://doi.org/10.1109/C366505.2025.11339990)

### Aporte

Describe plataforma EWS con dashboards administrativos personalizados, formularios de captura y desacople de inferencia ML — arquitectura análoga a Tesis Dashboard.

### Comparación

| Componente EarlySTEM | Tesis Dashboard |
|----------------------|-----------------|
| Dashboard admin | `RoleDashboard` + 14 secciones |
| Captura datos | Formularios Students/Courses/Grades |
| ML desacoplado | FastAPI `:5000` |
| JWT + roles | `AuthProvider` + RBAC |

### Aplicación al proyecto

`PredictionView` (admin/docente) y `StudentPredictionView` (estudiante) replican la dualidad de visualización institucional vs. personal del paper. La validación funcional mencionada en el artículo corresponde a casos TC-FE-03..05 del plan de pruebas del proyecto.

---

## Artículo 6

**Referencia:** Bañeres, D., Guerrero-Roldán, A.-E., Rodríguez, M. E., & Karadeniz, A. (2020). An Early Warning System to Detect At-Risk Students in Online Higher Education. *Applied Sciences*, 10(13), 4427.  
**DOI:** [10.3390/app10134427](https://doi.org/10.3390/app10134427)

### Aporte

Fundamenta sistemas de alerta temprana online con indicadores de engagement y dashboards para facilitadores; establece base empírica para EWS educativos.

### Comparación

| EWS element | Proyecto |
|-------------|----------|
| Indicadores riesgo | 10 features ML |
| Alertas | Modelo `Alerta`, `AlertsView` |
| Roles facilitador | `docente`, `admin` |
| Online / LMS | Actividad LMS en dashboard |

### Aplicación al proyecto

`AlertsView` y estados `AlertaEstado { nueva, en_seguimiento, resuelta }` en Prisma implementan el ciclo de vida de alertas que el artículo propone. El dashboard no solo muestra predicción: dispara workflow de seguimiento docente.

---

## Conclusión

El **dashboard por rol** responde a revisión sistemática LAD (10.1007/s10639-023-12401-4, 10.3390/educsci14010082) y checklist de calidad (10.1186/s41239-023-00394-6). La fusión LMS + calificaciones en vistas y predicción sigue evidencia de learning analytics en LMS (10.18608/jla.2023.8093). La arquitectura EWS con dashboards personalizados y alertas está alineada con EarlySTEM y sistemas online (10.1109/C366505.2025.11339990, 10.3390/app10134427), materializada en `ROLE_SECTIONS`, `RoleDashboard` y módulos de alerta del shell Next.js.
