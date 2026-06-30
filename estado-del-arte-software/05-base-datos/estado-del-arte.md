# Estado del Arte — Base de Datos (MySQL / Prisma)

**Tecnologías implementadas:** MySQL (XAMPP / Railway), Prisma 6.3, 51 modelos, enums de dominio, migraciones versionadas.

**Evidencia:** `backend/prisma/schema.prisma`, `backend/package.json` (scripts `db:*`), `DATABASE_URL`.

---

## Introducción

La persistencia de Tesis Dashboard usa **MySQL** como motor relacional y **Prisma ORM** como capa de acceso tipado desde Express. El esquema v3.0 modela el dominio I.E.P. BLENKIR: personas, estructura académica, matrículas, evaluaciones, actividad LMS, predicciones, alertas y mensajería.

---

## Problema

Un sistema de predicción de deserción escolar exige:

- Integridad referencial entre estudiantes, cursos, notas y predicciones.
- Transacciones ACID en operaciones de matrícula y calificación.
- Esquema evolutivo con migraciones reproducibles en desarrollo y producción.
- Tipos de dominio (`RolCodigo`, `NivelRiesgo`, `EstudianteEstado`) alineados con RBAC y ML.

Bases relacionales maduras y ORMs modernos reducen deuda técnica frente a document stores para este dominio altamente estructurado.

---

## Artículo 1

**Referencia:** Saputra, R., et al. (2023). Design and Implementation of Academic Information System (SIAKAD) Using MySQL Database. *SISKOM*, 3(2).  
**DOI:** [10.35870/siskom.v3i2.796](https://doi.org/10.35870/siskom.v3i2.796)

### Aporte

Implementa SIAKAD institucional sobre **MySQL** con modelo entidad-relación para estudiantes, cursos y calificaciones; destaca ACID y consultas JOIN para reportes académicos.

### Comparación

| Entidad SIAKAD | Modelo Prisma |
|----------------|---------------|
| Estudiante | `Estudiante`, `Persona` |
| Curso / sección | `Curso`, `Seccion` |
| Calificación | `Nota`, `Evaluacion` |
| Año lectivo | `AnioLectivo` |

### Aplicación al proyecto

`schema.prisma` encabezado declara "51 tablas" para predicción de deserción primaria. Las relaciones estudiante–matrícula–sección soportan `EnrollmentsView` y agregados del dashboard — mismo patrón relacional que el SIAKAD del artículo.

---

## Artículo 2

**Referencia:** Wijaya, R., et al. (2024). Implementation of Prisma ORM on Backend Web Development. *DECODE*, 4(3).  
**DOI:** [10.51454/decode.v4i3.792](https://doi.org/10.51454/decode.v4i3.792)

### Aporte

Compara Prisma con Sequelize y TypeORM; reporta menor boilerplate, migraciones declarativas y cliente TypeScript generado automáticamente.

### Comparación

| ORM | Ventaja paper | Script proyecto |
|-----|---------------|-----------------|
| Prisma | Schema-first | `schema.prisma` |
| Migraciones | Versionadas | `prisma/migrations/` |
| Cliente | `prisma generate` | `postinstall` en package.json |

### Aplicación al proyecto

Todos los controladores Express usan `@prisma/client` tipado. El artículo justifica Prisma sobre drivers `mysql2` directos dado el tamaño del esquema (51 modelos) y la necesidad de enums compartidos con TypeScript (`RolCodigo` en `auth.ts`).

---

## Artículo 3

**Referencia:** Priyanka, S., et al. (2025). Design and Implementation of Relational Database Using Prisma ORM. *International Journal of Software Engineering and Applications*.  
**DOI:** [10.46299/j.isjea.20260503.05](https://doi.org/10.46299/j.isjea.20260503.05)

### Aporte

Detalla modelado relacional con Prisma: cardinalidades, índices y seeds para entornos de demostración.

### Comparación

| Práctica | Proyecto |
|----------|----------|
| Seeds | `prisma/seed.ts`, `seed-demo.ts` |
| Reset demo | `db:reset:full`, `validate-demo-data.mjs` |
| Deploy prod | `prisma migrate deploy`, Railway scripts |

### Aplicación al proyecto

Scripts `db:seed:demo` y `db:reset:academic` en `package.json` replican el ciclo desarrollo→demo→validación del artículo. Evidencias QA del proyecto dependen de datos semilla reproducibles vía Prisma seed.

---

## Artículo 4

**Referencia:** Autores varios (2024). A Data-Oriented Academic Burnout Monitoring System. *IJIRT*, 12(10).  
**DOI:** [10.64643/ijirtv12i10-194282-459](https://doi.org/10.64643/ijirtv12i10-194282-459)

### Aporte

Selecciona **MySQL** por garantías ACID, modelado relacional de entidades académicas y ecosistema maduro para aplicaciones Node.js educativas.

### Comparación

| Requisito | MySQL en paper | Proyecto |
|-----------|----------------|----------|
| ACID matrículas | ✓ | Transacciones Prisma |
| Relaciones | Estudiante–curso | `Matricula`, `Inscripcion` |
| Stack Node | Express + MySQL | Express + Prisma + MySQL |

### Aplicación al proyecto

Tablas de asistencia (`Asistencia`), actividad LMS y notas alimentan features ML persistidas antes de inferencia. El artículo valida MySQL para behavioral academic data — mismo tipo de datos que `ActividadLMS` y `RegistroAsistencia` en el esquema.

---

## Artículo 5

**Referencia:** Bañeres, D., et al. (2021). A Predictive Analytics Infrastructure to Support a Trustworthy Early Warning System. *Applied Sciences*, 11(13), 5781.  
**DOI:** [10.3390/app11135781](https://doi.org/10.3390/app11135781)

### Aporte

Describe infraestructura de datos para EWS confiable: almacenamiento estructurado de variables predictoras, trazabilidad de predicciones y separación entre datos operacionales y modelo.

### Comparación

| Infraestructura EWS | Tabla/modelo proyecto |
|---------------------|----------------------|
| Histórico predicciones | `Prediccion`, `HistorialPrediccion` |
| Nivel riesgo | Enum `NivelRiesgo` |
| Estado estudiante | `EstudianteEstado` |
| Alertas derivadas | `Alerta` |

### Aplicación al proyecto

`PredictionHistoryView` consume registros persistidos post-inferencia ML. El artículo exige trazabilidad que Prisma modela con timestamps y FK a `Estudiante` — requisito para auditoría académica y plan de pruebas TC-IA del proyecto.

---

## Artículo 6

**Referencia:** Ogunlola, O. Y., et al. (2023). Student Registration System Utilizing Role Based Access Control Model. *ICITST*.  
**DOI:** [10.20533/icitst.2023.0027](https://doi.org/10.20533/icitst.2023.0027)

### Aporte

Modela registro estudiantil con RBAC en base relacional: tablas de usuarios, roles y permisos con tres niveles (estudiante, staff, administrador).

### Comparación

| RBAC DB | Proyecto |
|---------|----------|
| Roles en BD | `Rol`, `Usuario.rolId` → `RolCodigo` |
| Tres niveles | admin / docente / estudiante |
| Registro | Flujo `StudentsView` + API |

### Aplicación al proyecto

Enum `RolCodigo` en `schema.prisma` L17–21 sincroniza BD con JWT (`auth.ts` L10) y `authorize()`. El artículo demuestra que modelar roles en esquema relacional es práctica estándar en sistemas de registro — patrón replicado en Prisma.

---

## Conclusión

**MySQL** se justifica por dominio académico relacional y ACID (10.35870/siskom.v3i2.796, 10.64643/ijirtv12i10-194282-459). **Prisma** reduce complejidad del esquema de 51 tablas y habilita migraciones/seeds reproducibles (10.51454/decode.v4i3.792, 10.46299/j.isjea.20260503.05). El modelado de predicciones, alertas y roles responde a infraestructura EWS confiable (10.3390/app11135781, 10.20533/icitst.2023.0027) implementada en `backend/prisma/schema.prisma`.
