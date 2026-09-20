# Plan del futuro Data Seed v2 de 200 estudiantes

**El Data Seed de 200 estudiantes NO fue regenerado porque corresponde a una fase posterior.**

**Los futuros 200 registros serán sintéticos para pruebas tecnológicas y NO evidencia científica.**

Data_Seed_200_Blenkir.xlsx es LEGACY / REFERENCIA DE VERSIÓN ANTERIOR y permanece intacto. No se utiliza como contrato ni se adapta la plataforma a sus columnas.

## Estructura que se diseñará después

- Identificación: código generado EST-XXX, DNI único de prueba, nombres, apellidos, contacto opcional, usuario, activo; matrícula MAT-2026-XXX, año 2026, grado y sección válidos con capacidad.
- Profesores: PROF-XXX automático, DNI, especialidad, correo, cuenta opcional; asignaciones a catálogo/curso ofertado, grado, sección y 2026.
- Académico: registros de notas por curso y periodo (0–20), asistencia por fecha con presente/ausente/tardanza/justificada. Promedio, desaprobados y asistencia porcentual se derivan; no son entradas del alta.
- LMS: secuencia temporal identificable de login/logout/acceso a curso, recursos publicados y consultados, actividades iniciadas/completadas, duración observada. Días activos derivados. No se incluye disminución sin historial/metodología suficiente.
- Relaciones: usuario → estudiante → matrícula → inscripciones; profesor → ofertas/asignaciones → materiales/actividades; progreso y eventos → estudiante y recurso. Respetar FKs, uniques, scopes y correlativos sin reiniciarlos.
- IA demo: podrá ejecutar un modelo compatible o fixtures explícitamente rotulados como prueba, con probabilidades, historial, factores, recomendaciones y alertas trazables. Nunca atribuir métricas científicas a estos datos.
- Comunicación: Director ↔ profesores y profesores ↔ alumnos asociados; avisos globales/de curso con lecturas. Nunca mensajes Director ↔ alumno.

## Secuencia posterior

1. Confirmar revisión funcional y cerrar pendientes descritos en el reporte; ensayar migraciones en copia segura.
2. Definir distribución institucional autorizada de grados/secciones/cursos/profesores, sin inventarla como hecho del colegio.
3. Diseñar manifiesto sintético, periodos y fechas coherentes de 2026; definir unidades y ventana de 28 días.
4. Implementar generador v2 mediante servicios transaccionales, con dry-run, entorno aislado y sin credenciales públicas comunes.
5. Validar 200 identidades únicas, capacidades, matrículas, inscripciones, permisos, correlativos, cálculos y trazabilidad. Solo después producir el nuevo archivo/dataset.

Los scripts de 9 y 660 fueron archivados en legacy; sus ubicaciones anteriores rechazan ejecución. Los comandos de reset antiguo y exportaciones de cuentas antiguas están deshabilitados. No deben reutilizarse sus códigos ni sus variables LMS.
