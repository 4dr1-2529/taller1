# Estado del Arte — Backend (Express / APIs REST / Prisma)

**Tecnologías implementadas:** Express 4.21, Node.js ≥20, Prisma 6.3, CORS, Helmet, Morgan, express-rate-limit, 87+ rutas REST.

**Evidencia:** `backend/src/index.ts`, `backend/src/routes/index.ts`, `backend/package.json`.

---

## Introducción

El backend de Tesis Dashboard es una API REST monolítica en **Express** que expone recursos académicos (estudiantes, profesores, cursos, matrículas, notas, asistencia, LMS, predicciones, alertas, mensajería, reportes). **Prisma** actúa como capa de acceso a datos sobre MySQL. Cada ruta protegida aplica middleware `authenticate` y `authorize` según `RolCodigo`.

---

## Problema

Un sistema de predicción de deserción requiere:

- Endpoints REST estables para el frontend Next.js y el servicio ML.
- Agrupación lógica de rutas por dominio académico.
- Persistencia tipada y migraciones reproducibles.
- Middleware transversal: CORS, sanitización, rate limiting y manejo de errores uniforme.

Frameworks minimalistas como Express permiten implementar este contrato sin la sobrecarga de plataformas opinionadas, manteniendo control sobre las 87 rutas documentadas en `routes/index.ts`.

---

## Artículo 1

**Referencia:** Sánchez, J., et al. (2024). RESTful API for Academic Grades Management System. *CCIT*, 18(2).  
**DOI:** [10.33050/ccit.v18i2.3603](https://doi.org/10.33050/ccit.v18i2.3603)

### Aporte

Propone API REST para gestión de calificaciones académicas con operaciones CRUD, autenticación y separación cliente-servidor — dominio directamente cubierto por el módulo de notas del proyecto.

### Comparación

| Recurso REST (paper) | Endpoint proyecto |
|----------------------|-------------------|
| Calificaciones | `GET/POST /grades`, `ProfessorGradesView` |
| Estudiantes | `GET/POST /students` |
| Autenticación | `POST /auth/login` |

### Aplicación al proyecto

`GradesView` y `ProfessorGradesView` consumen rutas de notas vía `api.ts`. El artículo valida el patrón REST para dominio educativo que ya está implementado en `backend/src/routes/index.ts` con verbos HTTP estándar (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) declarados en `index.ts` líneas 33–34.

---

## Artículo 2

**Referencia:** Wijaya, R., et al. (2024). Implementation of Prisma ORM on Backend Web Development. *DECODE*, 4(3).  
**DOI:** [10.51454/decode.v4i3.792](https://doi.org/10.51454/decode.v4i3.792)

### Aporte

Evalúa Prisma ORM en backends Node.js: tipado automático, migraciones y reducción de SQL manual frente a query builders tradicionales.

### Comparación

| Aspecto | SQL manual | Prisma (proyecto) |
|---------|------------|-------------------|
| Tipos | Manuales | `@prisma/client` generado |
| Migraciones | Scripts ad hoc | `prisma migrate deploy` |
| Esquema | Disperso | `schema.prisma` centralizado |

### Aplicación al proyecto

`backend/package.json` define `postinstall: prisma generate` y scripts `db:migrate`, `db:seed`. Los controladores importan `prisma` desde `utils/prisma.ts`; el artículo justifica esta elección frente a drivers MySQL crudos para un esquema de 51 tablas en `backend/prisma/schema.prisma`.

---

## Artículo 3

**Referencia:** Autores varios (2024). A Data-Oriented Academic Burnout Monitoring System. *IJIRT*, 12(10).  
**DOI:** [10.64643/ijirtv12i10-194282-459](https://doi.org/10.64643/ijirtv12i10-194282-459)

### Aporte

Documenta capa de negocio con **Express.js** organizada en handlers por dominio (autenticación, estudiantes, facultad, administración) y middleware CORS, JSON parsing y manejo de errores HTTP.

### Comparación

| Middleware (paper) | `backend/src/index.ts` |
|--------------------|------------------------|
| CORS | `cors({ origin, credentials })` L23–35 |
| JSON body | `express.json({ limit: "2mb" })` L38 |
| Seguridad headers | `helmet()` L19–22 |
| Sanitización | `sanitizeBody` L40 |

### Aplicación al proyecto

La estructura del artículo coincide con `index.ts`: pipeline Express → rutas → `errorHandler`. Rutas de asistencia, LMS y burnout académico del paper tienen equivalentes en `/attendance`, `/lms` y agregados de actividad estudiantil.

---

## Artículo 4

**Referencia:** Nugroho, A. S., et al. (2024). Microservices Architecture for Smart Campus Using API Gateway. *Businta*, 7(2).  
**DOI:** [10.31763/businta.v7i2.635](https://doi.org/10.31763/businta.v7i2.635)

### Aporte

Presenta campus inteligente con microservicios comunicados por REST y API Gateway; demuestra desacoplamiento entre módulos académicos.

### Comparación

| Patrón | Campus paper | Tesis Dashboard |
|--------|--------------|-----------------|
| Comunicación | REST JSON | Express → FastAPI ML |
| Gateway | API Gateway | Express como punto único |
| Dominios | Académico, usuarios | students, teachers, predictions |

### Aplicación al proyecto

Aunque el proyecto usa monorepo con tres procesos (`:3029`, `:4000`, `:5000`), Express centraliza el contrato REST hacia el frontend. La ruta de predicción en backend delega al servicio ML — mismo principio de desacoplamiento que el artículo describe para campus, sin desplegar gateway dedicado.

---

## Artículo 5

**Referencia:** Autores varios (2025). University Registration System Based on Microservices Architecture. *Procedia Computer Science*.  
**DOI:** [10.1016/j.procs.2025.09.066](https://doi.org/10.1016/j.procs.2025.09.066)

### Aporte

Analiza registro universitario con microservicios Node.js y APIs REST; destaca escalabilidad y mantenibilidad en flujos de matrícula.

### Comparación

| Flujo | Paper | Proyecto |
|-------|-------|----------|
| Matrícula | Servicio dedicado | `POST /enrollments`, `EnrollmentsView` |
| Validación | API REST | Zod + Prisma constraints |
| Roles | Servicios separados | `authorize(admin)` en matrículas |

### Aplicación al proyecto

`EnrollmentsView` y rutas de matrícula en `routes/index.ts` implementan el caso de uso central del artículo. Express + Prisma permiten transacciones ACID en MySQL para matrícula estudiante–sección–año lectivo, requisito explícito en sistemas de registro académico.

---

## Artículo 6

**Referencia:** Priyanka, S., et al. (2025). Design and Implementation of Relational Database Using Prisma ORM. *International Journal of Software Engineering and Applications*.  
**DOI:** [10.46299/j.isjea.20260503.05](https://doi.org/10.46299/j.isjea.20260503.05)

### Aporte

Detalla diseño relacional con Prisma: modelado de entidades, relaciones y generación de cliente tipado para APIs REST.

### Comparación

| Prisma feature | Uso en proyecto |
|----------------|-----------------|
| `model` + relaciones | 51 modelos en `schema.prisma` |
| Enums | `RolCodigo`, `NivelRiesgo`, `AlertaEstado` |
| Seeds | `prisma/seed.ts`, `seed-demo.ts` |

### Aplicación al proyecto

Enums `RolCodigo { admin docente estudiante }` alimentan directamente `authorize(...)` en rutas. El artículo respalda Prisma como capa entre Express y MySQL para dominios con relaciones estudiante–curso–nota–predicción que serían propensas a errores con SQL ad hoc.

---

## Conclusión

**Express** se eligió por ser el estándar de facto en APIs REST educativas documentadas (10.33050/ccit.v18i2.3603, 10.64643/ijirtv12i10-194282-459) con middleware verificable en `index.ts`. **Prisma** aporta tipado y migraciones sobre el esquema relacional (10.51454/decode.v4i3.792, 10.46299/j.isjea.20260503.05). La arquitectura REST desacoplada hacia el servicio ML sigue patrones de campus y registro universitario (10.31763/businta.v7i2.635, 10.1016/j.procs.2025.09.066), materializados en las 87 rutas de `backend/src/routes/index.ts`.
