# Estado del Arte — Arquitectura de Software

**Arquitectura implementada:** Monorepo de tres servicios — Next.js (presentación), Express+Prisma (aplicación/datos), FastAPI (inferencia ML) — comunicados por HTTP/REST.

**Evidencia:** `frontend/`, `backend/`, `machine-learning/`, `package.json` raíz, puertos 3029/4000/5000.

---

## Introducción

Tesis Dashboard v2.0 adopta una **arquitectura modular en procesos separados** dentro de un monorepo npm. El frontend nunca accede a MySQL directamente; el backend nunca entrena modelos en línea. Cada capa tiene responsabilidad única: UI, reglas de negocio + persistencia, y scoring ML.

---

## Problema

Los sistemas de alerta temprana académica deben:

- Escalar componentes independientemente (UI vs. inferencia ML costosa).
- Mantener contratos API estables entre capas.
- Permitir reentrenamiento ML sin redeploy del frontend.
- Garantizar trazabilidad de datos desde BD hasta predicción y alerta.

Arquitecturas monolíticas puras dificultan el desacople ML; microservicios completos añaden complejidad operativa innecesaria para un MVP de tesis. El proyecto adopta **separación pragmática en tres servicios**.

---

## Artículo 1

**Referencia:** Nugroho, A. S., et al. (2024). Microservices Architecture for Smart Campus Using API Gateway. *Businta*, 7(2).  
**DOI:** [10.31763/businta.v7i2.635](https://doi.org/10.31763/businta.v7i2.635)

### Aporte

Presenta campus inteligente con servicios desacoplados, API Gateway y comunicación REST entre módulos de asistencia, biblioteca y académico.

### Comparación

| Capa smart campus | Servicio proyecto |
|-------------------|-------------------|
| Gateway / BFF | Express `:4000` |
| UI | Next.js `:3029` |
| Analytics | FastAPI `:5000` |
| Protocolo | REST JSON |

### Aplicación al proyecto

Express concentra 87 rutas y actúa como backend-for-frontend hacia Next.js, análogo al gateway del artículo sin producto comercial intermedio. El servicio ML es un microservicio de inferencia invocado solo en predicción.

---

## Artículo 2

**Referencia:** Autores varios (2025). University Registration System Based on Microservices Architecture. *Procedia Computer Science*.  
**DOI:** [10.1016/j.procs.2025.09.066](https://doi.org/10.1016/j.procs.2025.09.066)

### Aporte

Describe descomposición de registro universitario en servicios Node.js comunicados por REST; analiza mantenibilidad y despliegue independiente.

### Comparación

| Principio | Proyecto |
|-----------|----------|
| Servicios por dominio | academic API vs. ML API |
| Node.js backend | Express ESM `type: module` |
| REST contracts | OpenAPI implícito en rutas |
| Despliegue | Railway (`start:prod` scripts) |

### Aplicación al proyecto

Scripts `backend/scripts/railway-start.mjs` y `ml:train` separado de `npm run dev` permiten ciclo de vida distinto: API siempre disponible, reentrenamiento ML bajo demanda — coherente con el desacople del artículo.

---

## Artículo 3

**Referencia:** Bañeres, D., et al. (2025). EarlySTEM: Machine Learning Platform for Early Identification of Dropout Risk. *IEEE EDUCON*.  
**DOI:** [10.1109/C366505.2025.11339990](https://doi.org/10.1109/C366505.2025.11339990)

### Aporte

Usa plantilla **arc42** y Docker para separar presentación, seguridad, aplicación, datos e inferencia ML en EWS STEM.

### Comparación

| Vista arc42 | Directorio proyecto |
|-------------|---------------------|
| Presentación | `frontend/` |
| Seguridad | `backend/src/middleware/` |
| Aplicación | `backend/src/routes/` |
| Datos | `backend/prisma/` |
| ML / scripts | `machine-learning/` |

### Aplicación al proyecto

La estructura de carpetas del monorepo mapea 1:1 las vistas arquitectónicas del artículo. EarlySTEM usa React+PostgreSQL; este proyecto usa Next.js+MySQL — misma separación lógica, distinta implementación tecnológica.

---

## Artículo 4

**Referencia:** Bañeres, D., et al. (2021). A Predictive Analytics Infrastructure to Support a Trustworthy Early Warning System. *Applied Sciences*, 11(13), 5781.  
**DOI:** [10.3390/app11135781](https://doi.org/10.3390/app11135781)

### Aporte

Define infraestructura de analítica predictiva confiable: pipeline de datos, servicio de inferencia desacoplado y capa de presentación para stakeholders institucionales.

### Comparación

| Componente infra | Flujo proyecto |
|------------------|----------------|
| Data pipeline | Prisma → features ML |
| Inference service | FastAPI `/predict` |
| Presentation | Dashboard + alertas |
| Trust / audit | `HistorialPrediccion` |

### Aplicación al proyecto

Backend agrega datos de `Nota`, `Asistencia`, `ActividadLMS` antes de llamar al servicio ML con vector de 10 features. El artículo fundamenta no embeber ML dentro del servidor Express — decisión arquitectónica explícita del repositorio.

---

## Artículo 5

**Referencia:** Bañeres, D., Guerrero-Roldán, A.-E., Rodríguez, M. E., & Karadeniz, A. (2020). An Early Warning System to Detect At-Risk Students in Online Higher Education. *Applied Sciences*, 10(13), 4427.  
**DOI:** [10.3390/app10134427](https://doi.org/10.3390/app10134427)

### Aporte

Establece arquitectura de referencia para EWS online: captura de engagement, modelo predictivo y dashboard de facilitadores en capas separadas.

### Comparación

| Capa EWS | Implementación |
|----------|----------------|
| Captura | Formularios LMS, asistencia |
| Análisis | `machine-learning/` |
| Acción | Alertas + mensajería |
| Roles | admin / docente / estudiante |

### Aplicación al proyecto

El flujo completo del artículo — datos → predicción → intervención — está implementado end-to-end. `AlertsView` materializa la capa de acción que muchos EWS solo teorizan.

---

## Artículo 6

**Referencia:** Autores varios (2024). A Data-Oriented Academic Burnout Monitoring System. *IJIRT*, 12(10).  
**DOI:** [10.64643/ijirtv12i10-194282-459](https://doi.org/10.64643/ijirtv12i10-194282-459)

### Aporte

Documenta arquitectura de **tres capas** (presentación React, negocio Express, persistencia MySQL) para monitoreo académico conductual — patrón clásico validado empíricamente.

### Comparación

| Capa 3-tier | Proyecto |
|-------------|----------|
| Presentación | Next.js (evolución React SPA) |
| Negocio | Express REST |
| Datos | MySQL + Prisma |
| Extensión ML | 4.º proceso FastAPI |

### Aplicación al proyecto

El proyecto extiende el 3-tier del artículo con cuarto proceso ML sin romper separación: Express permanece dueño de transacciones y autorización; FastAPI es stateless inference. Monorepo npm (`@tesis/shared`) comparte tipos entre frontend y backend.

---

## Conclusión

La arquitectura de Tesis Dashboard combina **desacople de microservicios** documentado en campus y registro universitario (10.31763/businta.v7i2.635, 10.1016/j.procs.2025.09.066) con **plantilla EWS** de capas presentación–aplicación–datos–ML (10.1109/C366505.2025.11339990, 10.3390/app11135781, 10.3390/app10134427). El 3-tier Express+MySQL+React family (10.64643/ijirtv12i10-194282-459) se extiende pragmáticamente con FastAPI para inferencia, justificando el monorepo de tres servicios en puertos 3029/4000/5000.
