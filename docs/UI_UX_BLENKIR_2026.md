# UI/UX Blenkir 2026 — Fase 11

## Principios
Plataforma educativa institucional seria: limpieza, jerarquía, densidad equilibrada, datos reales
o estados vacíos profesionales ("—", "Sin datos", "Sin predicción"). Sin glassmorphism excesivo,
sin gradientes decorativos, sin métricas inventadas, sin animaciones que retrasen el uso (150–250ms,
`prefers-reduced-motion` respetado en shell/drawer/diálogos).

## Design system (existente, consolidado)
- **Tokens** `app/globals.css`: `--text-primary/secondary/muted`, `--border`, superficies,
  `--accent` + glow, semáforo de riesgo `--risk-low/medium/high`, radios únicos
  (`--radius-sm/md/lg`, duplicado `radius-lg` eliminado), sombras sutiles, `focus-visible`,
  `prefers-reduced-motion`, temas dark/light por variables.
- **Componentes** `components/ui/`: `SectionHeading` (h2 único, nuevo), `ConfirmDialog` (nuevo,
  accesible: Escape, foco atrapado, responsive), `PageSection`, `DataTablePanel` + `TableWrap`
  (título, búsqueda, filtros, loading, vacío, error, paginación), `KpiCard`, `FormField` (+
  `FormInput/FormSelect/FormTextarea` con error pegado al campo), `SearchField`, `TableToolbar`,
  `FilterBar` académico, `RiskBadge` (texto del nivel, no solo color), `StatusBadge`-equivalentes
  (`badge-warning` etc.), `EmptyState`, `Skeleton`, `AttendanceStatusPicker` (controles semánticos,
  mismo payload), `ChartCard`, `INPUT_CLASS/SELECT_CLASS/TEXTAREA_CLASS` (`lib/ui.ts`),
  botones `btn-primary/btn-secondary/btn-ghost`, toasts `sonner` (uno por operación, sin tecnicismos).

## Shell y navegación por rol
`AppSidebar` agrupado por dominios (Panel, Gestión académica, Seguimiento, Comunicación, Análisis,
Sistema según rol), iconos únicos por sección (dedup: Asignaciones `ArrowLeftRight`, Materiales
`Library`, Actividades `ListChecks`, Avisos `Megaphone`, Notas `NotebookPen`, Configuración
`Settings`), colapsable persistente en desktop, drawer móvil con foco atrapado/Escape/`inert`,
badge de alertas. `AppHeader`: breadcrumb simple ("Ruta de la página"), fecha, tema, notificaciones,
perfil+rol, sin repetir el nombre institucional.

## Decisiones por módulo (Fase 11)
- **Configuración**: reescrita — inputs invisibles por clases `premium-input/premium-button`
  inexistentes (P1) → `FormField` + `INPUT_CLASS` + `btn-primary`; secciones separadas
  (alertas institucionales / cuenta); `SectionHeading`.
- **Cursos**: reasignación instantánea por select (riesgo de cambio accidental, P2) → botón
  "Reasignar" + `ConfirmDialog` con docente destino; mismo endpoint `POST /courses/:id/reassign`;
  pluralización "1 curso".
- **Estructura**: eliminado hardcode "I.E.P. Huancayo" del título (P3).
- **Matrícula**: subtítulo shell corregido a regla 2026; hint de filtros sin estimación ficticia
  ("22 secciones · ~660 estudiantes" eliminado, P1).
- **Dashboard**: `avgGrade/avgAttendance` ahora `null` sin registros (backend cuenta notas/
  asistencias 2026) → "—" en vez de "0/20" (P2 verificado en captura).
- **Encabezados**: 12 vistas con h2 unificado vía `SectionHeading` (mismo tamaño/peso/tracking).

## Responsive y accesibilidad
Tablas con scroll horizontal controlado, formularios en grid adaptable, drawer + diálogos
responsive, labels visibles, errores junto al campo, `aria-label/current/modal`, contraste por
variables en ambos temas, riesgo siempre con texto.

## Gráficas
Recharts solo con datos reales, con título/unidad/tooltip/leyenda y estado sin datos; comparativas
de modelo e importancia de features vacías (`[]`) sin ML.

## Evidencia visual real (Playwright + Chrome del sistema, stack local, BD aislada)
Login OK 3 roles × desktop 1440×900 y móvil 390×844, cero errores de consola/página. Capturas en
`C:/Users/HP/AppData/Local/Temp/opencode/visual/`: dashboards de los 3 roles (desktop+móvil),
login, estructura, matrícula, cursos, configuración antes/después, dashboard tras fix de promedio,
diálogo de reasignación. Fixtures efímeros (1 admin + 1 docente + 2 estudiantes vía servicios
propios) eliminados tras la revisión con script de limpieza; sin residuos.

## Matriz rol×viewport×pantalla (revisado)
Director 1440: Dashboard/Grados/Configuración/Matrícula/Cursos OK. Director 390: Dashboard OK
(drawer, banner de error honesto si el API cae). Docente 1440/390: Reportes OK (sección persistida).
Estudiante 1440: Configuración OK (tras fix de inputs). Login 1440: OK.

## Pendientes (P3 / Fase 11+)
Barrido completo de las ~50 pantallas secundarias; pulido de gráficas con datos del seed;
light-mode fino por componente.
