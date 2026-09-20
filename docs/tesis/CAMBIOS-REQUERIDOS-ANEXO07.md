# Cambios que deben trasladarse al Anexo 07

Documento de trazabilidad técnica; no modifica resultados ni conclusiones científicas.

- Roles y matriz de permisos: incorporar la tabla de docs/roles-permisos.md; Director administra/supervisa, Profesor escribe académicos, Estudiante solo propio.
- RF/HU/casos de uso: registro transaccional con correlativos, validación de capacidad y rollback; matrícula única 2026; bajas lógicas; asignación docente separada del alta.
- Comunicación: casos bidireccionales Director–Profesor y Profesor–alumno asociado; casos negativos 403 Director–alumno; avisos unidireccionales con lectura.
- Materiales, actividades y LMS: publicaciones por curso, acceso autorizado, inicio/completado, eventos observados y duración estimada. Eliminar foros y tareas ficticias de requisitos activos.
- IA: vector de siete variables y trazabilidad de modelo/entradas; sin riesgo manual ni fallback ficticio. Reentrenamiento y validación científica pendientes de datos autorizados.
- APIs: actualizar con docs/API.md y routes/index.ts. Casos de prueba: correlativos históricos, concurrencia, rollback, scopes, mensajería y avisos.
- Evidencias: regenerar capturas y resultados de aceptación después de revisión funcional; conservar evidencia anterior como histórica, nunca hacerla pasar por evidencia del contrato nuevo.

No cambiar conclusiones ni métricas históricas arbitrariamente. No afirmar superioridad de un modelo sin evaluación correspondiente.
