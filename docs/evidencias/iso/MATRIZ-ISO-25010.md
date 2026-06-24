# Matriz ISO 25010 — Evidencias visuales locales

Generado: 2026-06-24T00:01:13.415Z · Entorno **local** (sin Railway/Vercel)

| Archivo evidencia | Característica ISO 25010 | Qué demuestra |
|-------------------|--------------------------|---------------|
| capturas/01-login/login-pantalla-inicial.png | Usabilidad | Pantalla de acceso clara y branding institucional |
| capturas/01-login/login-director-credenciales.png | Usabilidad | Formulario con validación de campos |
| capturas/01-login/login-director-sesion-activa.png | Seguridad · Funcionalidad | Autenticación Director exitosa (JWT local) |
| capturas/01-login/login-profesor-sesion-activa.png | Funcionalidad | Autenticación Profesor con RBAC |
| capturas/01-login/login-estudiante-sesion-activa.png | Funcionalidad | Autenticación Alumno con vista restringida |
| capturas/14-qa/login-error-controlado.png | Seguridad | Error controlado ante credenciales inválidas |
| capturas/02-dashboard/dashboard-director.png | Funcionalidad · Usabilidad | KPIs reales desde MySQL local (660 alumnos) |
| capturas/02-dashboard/dashboard-profesor.png | Funcionalidad | Dashboard docente con ámbito de salones |
| capturas/02-dashboard/dashboard-alumno.png | Usabilidad | Vista personal del estudiante |
| capturas/03-profesores/profesores-listado.png | Funcionalidad | Listado 23 profesores reales |
| capturas/03-profesores/profesor-detalle.png | Funcionalidad | Detalle docente con datos de BD |
| capturas/03-profesores/asignaciones-docentes.png | Funcionalidad | Asignaciones tutoría y polidocencia |
| capturas/03-profesores/carga-academica-asignaciones.png | Funcionalidad | Carga académica por docente |
| capturas/04-cursos/cursos-listado.png | Funcionalidad | Catálogo de cursos |
| capturas/04-cursos/cursos-asignaciones.png | Funcionalidad | Asignación curso–profesor–sección |
| capturas/05-estudiantes/estudiantes-listado-director.png | Funcionalidad | Matrícula estudiantil completa |
| capturas/05-estudiantes/estudiante-detalle.png | Funcionalidad | Ficha individual con métricas |
| capturas/05-estudiantes/alumno-mis-notas.png | Usabilidad | Consulta de notas por el alumno |
| capturas/06-notas/notas-bimestre-I.png | Funcionalidad | Registro notas bimestre I |
| capturas/06-notas/notas-bimestre-II.png | Funcionalidad | Registro notas bimestre II |
| capturas/06-notas/notas-proceso-completo.png | Funcionalidad | Flujo completo registro con filtros |
| capturas/07-prediccion/prediccion-resultado-riesgo.png | Funcionalidad | Predicción IA: nivel de riesgo y score |
| capturas/07-prediccion/prediccion-nivel-probabilidad.png | Funcionalidad | Probabilidad de abandono visible |
| capturas/08-dashboard-ia/alertas-listado.png | Funcionalidad | Alertas tempranas generadas |
| capturas/08-dashboard-ia/metricas-ia-graficos.png | Funcionalidad | Gráficos comparativos modelos ML |
| capturas/08-dashboard-ia/dashboard-ia-completo.png | Usabilidad | Panel IA con métricas y predicción |
| capturas/09-reportes/reportes-vista-completa.png | Funcionalidad | Módulo reportes académicos |
| capturas/09-reportes/reporte-excel-estudiantes.png | Funcionalidad | Exportación Excel estudiantes |
| capturas/09-reportes/reporte-pdf-riesgo-curso.png | Funcionalidad | Exportación PDF riesgo por curso |
| ia/matriz-confusion.png | Funcionalidad | Matriz de confusión — modelo entrenado local |
| ia/curva-roc.png | Funcionalidad | Curva ROC multiclase OvR |
| ia/feature-importance.png | Mantenibilidad | Importancia de variables (explicabilidad) |
| ia/metricas-best-model.png | Funcionalidad | Accuracy, Precision, Recall, F1 agregados |
| ia/metricas-accuracy.png | Funcionalidad | Métrica Accuracy en test set |
| ia/metricas-precision.png | Funcionalidad | Métrica Precision weighted |
| ia/metricas-recall.png | Funcionalidad | Métrica Recall weighted |
| ia/metricas-f1.png | Funcionalidad | Métrica F1-Score weighted |
| ia/metricas-auc.png | Funcionalidad | AUC macro one-vs-rest |
| base_datos/diagrama-er-blenkir.png | Mantenibilidad | ER actualizado desde schema.prisma |
| arquitectura/arquitectura-general.png | Portabilidad | Capas del sistema en local |
| arquitectura/arquitectura-modelo-ia.png | Mantenibilidad | Pipeline ensemble ML |
| api/flujo-api-completo.png | Funcionalidad | Flujo Frontend→API→Prisma→MySQL→IA |
| iso/iso-25010-aplicado.png | Calidad del producto | Mapa ISO 25010 con cobertura |
| iso/macroproceso-iso-9001.png | Calidad del producto | Macroproceso académico ISO 9001 |
| iso/iso-29119-aplicado.png | Fiabilidad | Plan de pruebas ISO 29119 |
| qa/qa-resumen-visual.png | Fiabilidad | Resumen visual tests locales PASS |
| capturas/14-qa/qa-casos-exitosos.png | Fiabilidad | Casos de prueba exitosos documentados |
| qa/RESUMEN-QA.md | Fiabilidad | Type-check, Jest, pytest, lint — local |
