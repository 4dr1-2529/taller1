# Dataset definitivo 2026 V5: revision local

> **SUPERADO POR** `docs/DATASET_DEFINITIVO_2026_V6_LOCAL.md`: el lector
> (`backend/scripts/lib/definitive-dataset-reader.mjs`) ahora exige el workbook V6
> (`BLENKIR_DATASET_DEFINITIVO_2026_CIENTIFICO_SINTETICO_V6.xlsx`,
> `DATASET_ID=BLENKIR_DATA_SEED_V6_250`). Este documento se conserva como referencia
> histórica de la versión auditada V5.

DATOS 100% SINTÉTICOS — USO EXCLUSIVO PARA PRUEBAS TECNOLÓGICAS, QA Y DEMOSTRACIÓN. NO REPRESENTAN LA POBLACIÓN REAL DE LA I.E.P. BLENKIR Y NO CONSTITUYEN EVIDENCIA CIENTÍFICA PARA ENTRENAR O VALIDAR EL MODELO PREDICTIVO.

## Fuente inmutable

- Rama de trabajo: `dataset-definitivo-2026`.
- Base: `b4bd4aea19bbaec43b6874454de4b46b6fb9f151`.
- Archivo: `backend/prisma/data/definitive-2026/BLENKIR_DATASET_DEFINITIVO_2026_AUDITADO_V5.xlsx`.
- SHA256: `978d9480fdea74944e3ecb0e8f33e0f55f7324c2a9ee4897742af2aefb3ba72e`.
- Semilla: `20260921`. Corte: `2026-09-21`.
- SHA256 logico generado: `18d80a5e2e0813269d15c63c8be95867c58abd34907ace68b9c84c96d57302b0`.
- Se leen las 18 hojas. Se rechazan otro XLSX en la carpeta, hash distinto, formulas, encabezados distintos, duplicados y referencias invalidas.
- `ImportConfig.dataset_version` conserva una etiqueta anterior; la identidad de esta herramienta es el archivo V5 y su hash obligatorio, no esa etiqueta informativa. No se modifica el Excel.

## Ejecucion local sin base de datos

```sh
npm run db:dataset:validate --workspace=backend
npm run db:dataset:dry-run --workspace=backend
```

Ambos comandos leen el XLSX y generan las tablas exclusivamente en memoria. No cargan `.env`, no instancian Prisma, no necesitan passwords y no escriben archivos poblacionales. `db:dataset:import` tambien es DRY_RUN por defecto.

La futura ejecucion real requiere argumento explicito `--execute`, las tres autorizaciones `ALLOW_DEFINITIVE_DATASET_IMPORT=true`, `DEFINITIVE_DATASET_EXECUTE=true`, `ALLOW_PRODUCTION_DATASET_IMPORT=true`, y `NODE_ENV=production`. Requiere DATABASE_URL y las tres variables de password inicial; no tiene fallback hacia credenciales de MySQL. Se usa bcrypt cost 12 con salt independiente por usuario. Nada esta conectado a startup, postinstall, migraciones o deploy.

Antes de insertar: comprobar cero poblacion/actividad/ML/legacy, estructura, RBAC, calendario, features, correlativos y salas institucionales. La carga completa usa una transaccion Serializable, bloqueo del anio lectivo, inserciones por lotes y postchecks antes del commit. Una segunda ejecucion no cumple PRESEED_ZERO y aborta. Nunca hay cleanup, reset, DROP ni TRUNCATE.

## Conteos verificados en memoria

| Entidad | Total |
| --- | ---: |
| User (1 admin, 24 docentes, 250 estudiantes) | 275 |
| Teacher / Student | 24 / 250 |
| Matricula (activa / retirada / trasladada) | 225 / 15 / 10 |
| Course / TeacherCourseAssignment | 328 / 328 |
| TutorSeccion (solo 1A-2D) | 8 |
| Asignaciones inferiores true / superiores false | 104 / 224 |
| Enrollment (activa / retirada) | 3354 / 370 |
| Grade (B1 / B2 / B3 / B4) | 3724 / 3724 / 2761 / 0 |
| Attendance | 34950 |
| AcademicHistory (B1 / B2 / B3) | 250 / 250 / 225 |
| ResumenAsistencia | 750 |
| CourseResource / AcademicActivity | 656 / 328 |
| ActivityProgress / LmsEvent | 3354 / 4610 |
| Prediction, factores, snapshots, Alert, recomendaciones, artefactos ML | 0 |

Las 7 features se validan contra las filas estructurales existentes; no se insertan. Los 16 especialistas PROF-009 a PROF-024 tienen exactamente 2 cursos y 7 secciones. Se respeta el limite configurado del backend: si es menor que 7 se aborta.

Correlativos finales: estudiante 250, profesor 24, matricula 250. Siguientes codigos: `EST-251`, `PROF-025`, `MAT-2026-251`. No se cambia el servicio de correlativos.

## Derivacion y decisiones de generacion

- Notas B1/B2 completas; B3: 11 cursos para cada activo de 1-2 y 13 para cada activo de 3-6. Los 25 sin notas B3 no reciben historial B3. Una nota cero de cobertura es evidencia sintetica explicita, no un sustituto de ausencia de evaluacion.
- Asistencia: 50, 55 y 36 dias laborales. Los 25 no activos se asignan deterministicamente a las cinco cohortes ya especificadas (3 retirados y 2 trasladados por cohorte), con 10/20/25/30/35 dias de B3. Total B3 historico no activo: 600. Todos los estudiantes tienen evidencia computable en los tres periodos; por eso hay 750 resumenes.
- Porcentaje: presentes o tardanzas sobre dias no justificados. El generador aborta si un resumen no tiene evidencia computable; no persiste un cero ficticio. La funcion de calculo devuelve null para un intervalo exclusivamente justificado.
- Promedio general: media de las medias por oferta. Cada historial usa solo notas de su periodo y asistencia del mismo periodo. No se copian promedios previos.
- Al importar se recalcula el resumen desde las filas guardadas con las consultas y formula de `refreshAcademicSummary`. El postcheck admite como maximo un centavo por orden de suma/precision; se conserva el resultado del calculo del backend.
- `oferta_codigo` del Excel es clave logica de enlace. El `Course.codigo` persistido usa el formato del servicio `syncCourseOffering`, por ejemplo `ARI-1A`. La asignacion se crea primero y se enlaza a su oferta; no se elude la autoridad docente.
- Los objetivos del Excel son orientativos, no metricas finales ni etiquetas de riesgo. Los eventos LMS tienen duraciones derivadas de intervalos de hasta cinco minutos, no horas inventadas para alcanzar objetivos. Se conserva un estudiante activo sin login en la ventana.
- Las rutas `/synthetic/definitive-2026/...` son referencias internas de demostracion, no archivos publicados ni enlaces externos reales. Este trabajo no implementa un servidor de materiales ficticios.
- La ventana de indicadores se comprueba al corte. La aplicacion calcula su ventana movil respecto a la fecha de consulta.

## Alcance de las pruebas

Pruebas de lectura, determinismo, mutaciones negativas, conteos, fechas, scopes, medias, guards y dry-run sin entorno de base de datos. Comparacion con servicios reales mediante Prisma inyectado: 250 resumenes/indicadores, 328 ofertas y 16 scopes de polidocencia. El importador completo se prueba contra el DMMF de Prisma con almacenamiento en memoria y fallo inyectado.

Estas pruebas NO son una importacion real ni prueban un servidor MySQL real. No se conecto a Railway, Vercel o produccion. No se hizo commit, push, merge ni deploy. La revision previa a una futura importacion sigue siendo humana y debe comprobar el PRESEED_ZERO vigente.

Login confirmado por codigo: frontend envia email/password a `/auth/login`; el backend recibe ese contrato. No se probaron credenciales ni sesiones contra produccion.

## Resultado local

- Backend type-check: PASS.
- Tooling type-check: PASS (alcance del tsconfig existente); los nuevos MJS se comprueban con Node y ESLint.
- Lint del proyecto y lint especifico de los nuevos MJS: PASS.
- Backend tests: 69 PASS, 0 FAIL (37 Node + 32 TypeScript; incluye 10 pruebas nuevas).
- Sintaxis Node, git diff --check, validator y dry-run: PASS.
- DATABASE_CONNECTIONS=0 en dry-run. Ninguna prueba usa un servidor de base de datos.

Archivos modificados: `backend/package.json`, `package-lock.json`.

Archivos nuevos de implementacion:

- `backend/scripts/lib/definitive-dataset-reader.mjs`
- `backend/scripts/lib/definitive-operational-generator.mjs`
- `backend/scripts/lib/definitive-dataset-validation.mjs`
- `backend/scripts/lib/definitive-dataset-import.mjs`
- `backend/scripts/validate-definitive-dataset-2026.mjs`
- `backend/scripts/import-definitive-dataset-2026.mjs`
- `backend/tests/definitive-dataset.test.mjs`
- `backend/tests/fixtures/definitive-domain-equivalence.mjs`
- `backend/tests/fixtures/definitive-memory-database.mjs`
- Este documento.

El XLSX V5 fue proporcionado por el usuario y no fue modificado. Los cambios permanecen locales y sin commit. Schema y servicios de negocio no fueron modificados.

## Preflight conectado de solo lectura

El checkpoint inicial quedo registrado en `fbfe680242787c7fd3ab5fe0a8b75012795f235f`.
Una ruta independiente permite `npm run db:dataset:production-dry-run --workspace=backend`.
Requiere `NODE_ENV=production` y un `DATABASE_URL` MySQL suministrado externamente;
no carga dotenv, no acepta argumentos EXECUTE y no genera hashes de passwords.
Solo informa SET/MISSING de las tres variables de login.

El adaptador congelado expone unicamente count/findUnique/findFirst/findMany y tres
SELECT COUNT fijos para legacy. No expone PrismaClient, SQL arbitrario, transacciones
ni metodos de escritura. Comprueba PRESEED_ZERO antes de generar el plan, valida
claves naturales y resuelve las 328 ofertas con IDs estructurales existentes.

Antes y despues compara conteos de todas las tablas contempladas, correlativos y
huellas SHA256 del contenido estructural (incluye SystemConfig y salas).
Cualquier diferencia produce READ_ONLY_GUARD_VIOLATION=true. Esta comparacion
detecta cambios observables entre snapshots; no atribuye a la herramienta cambios
que pudiera realizar concurrentemente otro proceso.

La suite local incluye rechazo de poblacion, estructura ausente, features incorrectas,
correlativos no cero, claves naturales invalidas, configuracion ausente, IDs distintos,
conteos alterados y cambios estructurales sin cambio de conteo. Ninguna prueba
automatizada se conecta a Railway. Un PASS local no equivale a un PASS productivo:
este ultimo requiere ejecutar la ruta nueva contra el datasource verificado.
