# Estado del Arte — Seguridad (JWT / RBAC / Middleware)

**Tecnologías implementadas:** JWT (`jsonwebtoken`), bcrypt, `authenticate` + `authorize`, Helmet, CORS restrictivo, express-rate-limit, `sanitizeBody`.

**Evidencia:** `backend/src/middleware/auth.ts`, `backend/src/index.ts`, `frontend/src/contexts/AuthProvider.tsx`, `plan-pruebas/pruebas-seguridad/jwt.md`.

---

## Introducción

La seguridad de Tesis Dashboard combina **autenticación stateless con JWT** y **autorización RBAC** en tres roles (`admin`, `docente`, `estudiante`). Cada petición a rutas protegidas valida el token Bearer y comprueba el rol antes de ejecutar lógica de negocio. El frontend oculta secciones según `ROLE_SECTIONS`; el backend es la autoridad final con `authorize()`.

---

## Problema

Sistemas educativos con datos sensibles de menores y calificaciones enfrentan:

- Acceso no autorizado a notas, predicciones y datos personales.
- Escalación de privilegios (estudiante accediendo a rutas de admin).
- Ataques de fuerza bruta en login y abuso de API.
- Tokens robados o mal validados entre frontend y microservicio ML.

Se requiere defensa en profundidad: hash de contraseñas, JWT firmado, RBAC por endpoint y hardening HTTP.

---

## Artículo 1

**Referencia:** Aldea, C. L., & Bocu, R. (2025). Authentication Challenges and Solutions in Microservice Architectures. *Applied Sciences*, 15(22), 12088.  
**DOI:** [10.3390/app152212088](https://doi.org/10.3390/app152212088)

### Aporte

Analiza JWT como autenticación stateless en arquitecturas de microservicios: firma, expiración, filtro de validación y principio de mínimo privilegio (Zero Trust).

### Comparación

| Patrón paper | `auth.ts` |
|--------------|-----------|
| Header Bearer | `authorization?.startsWith("Bearer ")` L15 |
| Verificar firma | `jwt.verify(token, env.JWT_SECRET)` L20 |
| Claims en token | `{ sub, email, role }` L7–11 |
| Filtro previo | `authenticate` middleware L13–29 |

### Aplicación al proyecto

`authenticate` replica el flujo del artículo: extraer token → verificar → poblar `req.user`. El backend Express actúa como punto de validación antes de acceder a Prisma o delegar al servicio ML — mismo rol que el filtro JWT en microservicios del paper.

---

## Artículo 2

**Referencia:** Ruan, C., & Shahrestani, S. (2023). Towards for Designing Educational System Using Role-Based Access Control. *International Journal of Intelligent Engineering and Systems*, 16(2).  
**DOI:** [10.22266/ijies2023.0430.05](https://doi.org/10.22266/ijies2023.0430.05)

### Aporte

Propone RBAC para sistemas educativos online post-COVID: clasificación de usuarios, privilegios por rol y análisis formal de amenazas (MITM, escalación).

### Comparación

| RBAC educativo | Proyecto |
|----------------|----------|
| Clasificación usuario | `RolCodigo` enum |
| Privilegios | `authorize(...roles)` L32–39 |
| Separación datos | Rutas admin-only en `index.ts` |
| MFA (paper) | bcrypt + JWT (implementado) |

### Aplicación al proyecto

`authorize("admin")` en rutas de profesores, matrículas y reportes implementa el modelo "user classification, role assignment" del artículo. Caso TC-BE-05 del plan de pruebas verifica `POST /students` con token docente → 403.

---

## Artículo 3

**Referencia:** Ogunlola, O. Y., et al. (2023). Student Registration System Utilizing Role Based Access Control Model. *ICITST*.  
**DOI:** [10.20533/icitst.2023.0027](https://doi.org/10.20533/icitst.2023.0027)

### Aporte

Valida prototipo RBAC con tres roles (estudiante, staff, administrador) en sistema de registro; demuestra prevención de acceso no autorizado por simulación.

### Comparación

| Rol paper | Rol proyecto | Secciones UI |
|-----------|--------------|--------------|
| Student | `estudiante` | 6 secciones |
| Staff | `docente` | 10 secciones |
| Administrator | `admin` | 14 secciones |

### Aplicación al proyecto

La correspondencia tripartita es directa. `ROLE_SECTIONS` en `page.tsx` y `authorize()` en backend son las dos capas (UI + API) que el artículo recomienda para RBAC efectivo — la UI no sustituye validación servidor.

---

## Artículo 4

**Referencia:** Bañeres, D., et al. (2025). EarlySTEM: Machine Learning Platform for Early Identification of Dropout Risk. *IEEE EDUCON*.  
**DOI:** [10.1109/C366505.2025.11339990](https://doi.org/10.1109/C366505.2025.11339990)

### Aporte

Documenta EWS con **JWT** y **RBAC** en plataforma React + microservicios; validación de identidad institucional y control de acceso por rol en captura de datos sensibles.

### Comparación

| Seguridad EarlySTEM | Tesis Dashboard |
|---------------------|-----------------|
| JWT | `JWT_SECRET`, login API |
| RBAC | admin/docente/estudiante |
| Validación ID | Email + rol en token |
| Docker / despliegue | Railway scripts prod |

### Aplicación al proyecto

`AuthProvider` almacena token y rol en cliente; cada `api.get/post` adjunta Bearer. El artículo confirma que EWS educativos recientes adoptan JWT+RBAC como estándar — stack idéntico al implementado.

---

## Artículo 5

**Referencia:** Kumar, A., et al. (2025). Secure API Gateway with Rate Limiting and JWT Authentication. *IJRASET*, 13(4).  
**DOI:** [10.22214/ijraset.2025.68953](https://doi.org/10.22214/ijraset.2025.68953)

### Aporte

Demuestra que combinar **JWT** con **rate limiting** reduce brute force, abuso de tokens y ataques DDoS a nivel API.

### Comparación

| Control | `index.ts` |
|---------|------------|
| Rate limit | `express-rate-limit` (import L10) |
| JWT | Middleware auth en rutas |
| Capas | Gateway pattern → Express central |

### Aplicación al proyecto

`index.ts` aplica rate limiter global antes de montar `apiRoutes`. Junto con `helmet()` y CORS con `isCorsOriginAllowed`, materializa defensa en capas que el artículo cuantifica como reducción significativa de abuso API — relevante para endpoint `/auth/login`.

---

## Artículo 6

**Referencia:** Kuppinger, M., et al. (2019). On the Need for a General REST Security Framework. *Future Internet*, 11(3), 56.  
**DOI:** [10.3390/fi11030056](https://doi.org/10.3390/fi11030056)

### Aporte

Sistematiza amenazas REST (inyección, CSRF, broken authentication) y recomienda autenticación por token, HTTPS, validación de entrada y políticas CORS estrictas.

### Comparación

| Amenaza REST | Mitigación proyecto |
|--------------|---------------------|
| Broken auth | JWT + bcrypt passwords |
| Inyección | `sanitizeBody`, Prisma parametrizado |
| Headers inseguros | `helmet()` |
| CORS abierto | `isCorsOriginAllowed` whitelist |

### Aplicación al proyecto

`sanitizeBody` en pipeline L40 y Prisma (queries parametrizadas) abordan inyección SQL. CORS con `credentials: true` solo para orígenes permitidos (frontend `:3029`) implementa el principio de mínima exposición del framework REST del artículo.

---

## Conclusión

**JWT** para sesión stateless está validado en microservicios y EWS educativos (10.3390/app152212088, 10.1109/C366505.2025.11339990). **RBAC** tripartito en API y UI responde a literatura educativa específica (10.22266/ijies2023.0430.05, 10.20533/icitst.2023.0027). **Rate limiting**, Helmet y CORS implementan marco REST seguro (10.22214/ijraset.2025.68953, 10.3390/fi11030056) en `backend/src/index.ts` y `middleware/auth.ts`.
