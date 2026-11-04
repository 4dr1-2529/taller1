# Auditoría local de SonarQube

El proyecto local es `MiProyecto`, en http://localhost:9000. La documentación de SonarCloud en `docs/sonarqube.md` describe otro análisis y no acredita el estado de esta instancia.

## Ejecución

1. Iniciar Docker Desktop y el contenedor existente: `docker start sonarqube`.
2. Instalar las dependencias Python de pruebas, además de las dependencias de la aplicación: `python -m pip install -r machine-learning/requirements-dev.txt`.
3. Ejecutar `npm run type-check` y `npm run lint`.
4. Ejecutar `npm run coverage`. Se detiene si falla alguna suite.
5. Guardar `SONAR_TOKEN` en `.env.local` (archivo ignorado por Git). No añadir credenciales a `sonar-project.properties`.
6. Ejecutar `npm run sonar:local` y comprobar el Quality Gate tras finalizar la tarea de SonarQube.

`npm test` incluye backend, frontend y todos los tests Python. Las pruebas de integración con MySQL siguen siendo comandos independientes y requieren su base de datos aislada.

## Informes

- Backend: `coverage/backend/lcov.info`.
- Frontend: `coverage/frontend/lcov.info`.
- Python: `machine-learning/coverage.xml`.

Los comandos JavaScript usan `c8 --all`: los archivos fuente que las pruebas no importan también cuentan como no cubiertos. Los porcentajes calculados únicamente sobre archivos importados no son comparables con este alcance completo. No se añadieron exclusiones de código productivo para subir la cobertura.

Python mide líneas y ramas de `app` y `train`. `pytest.ini` usa un directorio temporal dentro del proyecto para evitar problemas de permisos del temporal global de Windows. No ejecutar dos suites Python simultáneas con ese mismo directorio temporal.

Un informe local de cobertura no acredita por sí solo el Quality Gate ni la resolución de bugs, vulnerabilidades o hotspots. Estos resultados deben verificarse en la instancia local autenticada después del análisis.
