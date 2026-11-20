# Revisión de alcance y configuración Sonar — 2026-11-19

## Identificación y límites

- La fuente indicada fue `taller1-main(1).zip`, pero no apareció. Al inicio se encontró `taller1-main.zip` (SHA-256 `105c411d6efda1c9ec4e3721f0679e4f15e93cf57f01e729332933ab1b63d2c1`); al empaquetar, esa ruta ya no estaba accesible. Su identidad exacta no está confirmada.
- El checkout disponible está en `codex/blenkir-v4-remediation`, commit `2e27c8db2a1b6921a99df850a91655e1a27c616a`; ya tenía cambios locales antes de esta revisión. No hice commit ni push.
- Los archivos añadidos/actualizados por esta revisión son `sonar-project.properties`, `sonar-project-cloud.properties`, `package.json`, `scripts/run-backend-coverage.mjs`, `scripts/run-ml-coverage.mjs`, `scripts/normalize-lcov.mjs`, `docs/sonarqube.md` y `docs/sonarqube-local.md`; este informe es nuevo. El ZIP fuente no se sobrescribió.

## Hallazgos y remediación

| ID | Hallazgo comprobado | Cambio aplicado | Estado |
|---|---|---|---|
| SON-01 | La configuración local analizaba `backend/src`, `frontend/src`, `machine-learning/app` y `train.py`, pero omitía `backend/scripts` y `machine-learning/utils`. La documentación de Cloud mencionaba `utils` aunque la configuración no tenía un archivo Cloud independiente. | Se añadieron ambos ámbitos y se creó `sonar-project-cloud.properties` para `4dr1-2529_taller1` / organización `4dr1-2529`. `MiProyecto` y `localhost:9000` se conservan en la configuración local. | Corregido en configuración; análisis pendiente. |
| SON-02 | La cobertura backend solo agregaba rutas `backend/src`; ML solo medía `app,train`. Así, el código que ahora entra al análisis no podía tener cobertura representada íntegramente. | El runner backend agrega `backend/scripts`; el runner ML agrega `utils` al reporte XML. | Corregido en runners; cifras nuevas pendientes de ejecución. |
| SON-03 | Exclusiones de seguridad ignoraban reglas completas en carpetas enteras de QA/migraciones; la exclusión de texto omitía todos los scripts y Markdown. Esas reglas podían ocultar credenciales o hallazgos reales. | Se retiraron las supresiones multicriterio y las exclusiones amplias de texto. Se excluyen solo dependencias, productos generados, cobertura, temporales y `.git` del análisis textual; el código se limita por `sonar.sources` a las rutas mantenidas. | Corregido en configuración; debe revisarse cualquier issue que aparezca en el nuevo análisis. |
| SON-04 | La documentación presentaba métricas Cloud de octubre como “actuales” sin advertir que eran snapshots y no existía evidencia posterior. | Se añadió una nota fechada y se separó la configuración local de Cloud. | Corregido documentalmente; estado actual de Cloud pendiente de consulta autenticada. |
| SON-05 | La instancia `http://localhost:9000/api/system/status` no respondió al sondeo de 5 segundos. Docker mostró cliente 29.9.3 y Compose 5.7.0, pero el daemon rechazó el acceso a `npipe:////./pipe/docker_engine`; también denegó lectura de `~/.docker/config.json`. | No se hizo análisis local ni se alteró el Quality Gate. | Bloqueado por acceso al motor/instancia. |

## Reglas de alcance y exclusión

| Regla | Decisión | Motivo |
|---|---|---|
| `backend/src`, `backend/scripts`, `frontend/src`, `machine-learning/app`, `machine-learning/train.py`, `machine-learning/utils` | Incluir como fuentes | Implementación activa y utilidades ejecutadas por las aplicaciones. Los scripts operativos pueden cambiar persistencia o despliegue y no deben desaparecer del análisis por una exclusión genérica. |
| `backend/tests`, `frontend/tests`, `machine-learning/tests` | Registrar como pruebas | Separar código de pruebas del código de producción. |
| `node_modules`, `.next`, `dist`, `coverage` | Excluir del análisis de código | Dependencias, builds y reportes generados. |
| `tmp`, `.git` | Excluir del análisis textual | Archivos temporales y metadatos Git; no es una exclusión de lógica fuente. |
| `python-ia`, `database`, `docs`, `estado-del-arte-software`, `plan-pruebas` | No incluir en `sonar.sources` | Quedan fuera por el alcance explícito de fuentes mantenidas, no por glob global. Markdown, scripts y migraciones siguen visibles al sensor de secretos salvo artefactos generados descritos arriba. Si cualquiera de esas áreas vuelve a ser código operativo, debe añadirse explícitamente. |
| Supresiones de reglas/issues | Ninguna | Los issues se deben inspeccionar y resolver o justificar de forma individual con evidencia. |

No se cambió el Quality Gate, los umbrales de cobertura ni se añadieron exclusiones de líneas para elevar métricas.

## Verificación de entorno al 2026-11-19

- `node --version`: `v25.9.0`; `npm --version`: `11.12.1`.
- `docker version`: cliente visible (`29.9.3`), sin permiso de conexión al daemon. `docker compose version`: `v5.7.0`.
- `docker info`: sin acceso al servidor; por ello no se inició MySQL ni se corrieron migraciones/integraciones.
- `npm ping --fetch-timeout=8000`: falló con `EACCES` hacia `https://registry.npmjs.org/`; no se reinstalaron dependencias.
- `python` del PATH apunta a WindowsApps y fue denegado. El runner encontró Python 3.12.3 en el virtualenv del workspace padre y ejecutó la suite ML (104/104 PASS).
- `http://localhost:9000/api/system/status`: timeout a los 5 s. No se generó task ID ni medidas Sonar nuevas.
- No se obtuvo un estado autenticado de SonarCloud. No hay captura de dashboard actual ni Quality Gate nuevo.

## Pruebas que sí se ejecutaron en el checkout

Las siguientes cifras son nuevas para el checkout/commit indicado arriba, con los cambios locales preexistentes más esta revisión. No describen por sí solas el ZIP descargable completo ni Sonar:

| Comando | Resultado | Medida/evidencia |
|---|---|---|
| `npm run prisma:generate` | PASS | Prisma Client v6.19.3 generado; no se conectó a ninguna base de datos. |
| `npm run type-check` | PASS | `@tesis/shared`, frontend, backend y herramientas backend. |
| `npm run lint` | PASS | ESLint `frontend/src`. |
| Cobertura backend | PASS | 603/603 pruebas, 0 fallos; 55.85% líneas, 86.60% ramas, 67.91% funciones. LCOV: `coverage/backend/lcov.info`; incluye 69 ficheros `backend/src` y 25 `backend/scripts`. |
| Cobertura frontend | PASS | 558/558 pruebas, 0 fallos; 91.81% líneas, 77.18% ramas, 87.26% funciones. LCOV: `coverage/frontend/lcov.info`. |
| Cobertura ML | PASS | 104/104 pruebas, 0 fallos; 572 sentencias y 148 ramas, 100% en ambos. Incluye `utils/validators.py`. XML: `machine-learning/coverage.xml`. |
| `npm run build` | PASS | Build de shared/backend y Next.js 16.4.6; compilación, TypeScript y páginas estáticas completados. |

Los LCOV finales usan rutas `/`; los intentos fallidos de entorno se conservaron en los logs.

## Inventario técnico estático del checkout

- Arquitectura observada: Next.js 16.4.6 en `frontend`, Express/TypeScript y Prisma/MySQL en `backend`, FastAPI/Python en `machine-learning`, más `packages/shared`. La workflow local usa MySQL 8.0 y no ejecuta Sonar; GitHub Actions no se lanzó.
- Despliegue y persistencia: Vercel declara Next.js; Compose contiene únicamente MySQL y no declara healthcheck; ML usa dependencias con hashes y usuario no-root; no se halló Dockerfile backend. El contador leyó 57 modelos Prisma, pero no se comprobaron tablas físicas ni migraciones aplicadas.
- Dataset y trazabilidad: el validador V6 pasó en modo solo lectura, sin importar/escribir: 250 estudiantes, 24 profesores, 275 usuarios, 250 matrículas y 725 historiales; SHA lógico `9eb428bd0612a1f6c19040219bea939429dcaaf410b376a0211d13418fb09c50`; reportó cero historial falso, contraseñas, predicciones o métricas ML, sin desglose de roles. No se hallaron archivos BPMN/Drawio/PlantUML/UML. Existe matriz Excel V4 sin validar ni actualizar en esta fase.

Este inventario describe solo el checkout; no demuestra equivalencia completa con el ZIP fuente ausente.

Al recuperar acceso, ejecutar el scanner local y el de Cloud con sus archivos de propiedades separados. `SONAR_TOKEN` debe estar solo en el entorno seguro del proceso; no se incluye en archivos ni en el paquete.

## Pendientes que requieren entorno o revisión humana

1. Habilitar acceso a Docker Desktop para este proceso y a la instancia Sonar local; ejecutar análisis `MiProyecto` y guardar task ID, fecha, commit, métricas y Quality Gate.
2. Configurar un secreto SonarCloud autorizado; ejecutar el archivo Cloud y registrar rama/commit y resultado. No se puede deducir el estado actual desde snapshots antiguos.
3. Ejecutar `npm run coverage` después de los cambios y revisar la cobertura de scripts operativos y `validators.py`; cerrar faltantes con pruebas de regresión.
4. Ejecutar `npm audit`/`pip-audit` cuando haya conectividad a los registros; el ping de npm falló y no se debe inferir “sin vulnerabilidades”.
5. Ejecutar MySQL aislado, Prisma, integraciones, E2E, seguridad/RBAC/IDOR, rendimiento y accesibilidad cuando el daemon y los servicios estén disponibles. Ninguna prueba contra Railway/producción se ejecutó.
6. Volver a adjuntar el archivo exacto `taller1-main(1).zip` (o restaurar `taller1-main.zip`) para generar y verificar el ZIP completo corregido. La rama Git está sucia y no demuestra que el ZIP y el checkout completo coincidan.
