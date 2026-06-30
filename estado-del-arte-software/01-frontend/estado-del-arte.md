# Estado del Arte — Frontend (Next.js / React)

**Tecnologías implementadas:** Next.js 16.2.4, React 19.2.4, Recharts 2.15, Tailwind CSS 4, Zod 3.24, App Router con Turbopack en puerto 3029.

**Evidencia:** `frontend/package.json`, `frontend/src/app/(shell)/page.tsx`, `frontend/src/services/api.ts`.

---

## Introducción

El frontend de Tesis Dashboard es una aplicación **Next.js 16** con App Router que consume la API REST del backend Express mediante cliente HTTP con token JWT. La interfaz implementa navegación condicional por rol (`admin`, `docente`, `estudiante`) y visualizaciones con Recharts en módulos de predicción, alertas y reportes.

---

## Problema

Los sistemas de alerta temprana académica requieren interfaces que:

- Carguen rápido en redes educativas con ancho de banda limitado.
- Presenten KPIs y gráficos sin recargar la página completa.
- Restrinjan vistas según el rol del usuario autenticado.
- Validen formularios de matrícula, notas y predicción antes de enviar datos al backend.

Un SPA React puro incrementa el tiempo de primera pintura (FCP); un framework híbrido como Next.js mitiga ese costo manteniendo la productividad de React.

---

## Artículo 1

**Referencia:** Indla, Y., Puranik, P. G., & Student, P. (2023). Analyzing the Impact of Next.JS on Site Performance and SEO. *International Journal of Computer Applications Technology and Research*, 12(10).  
**DOI:** [10.7753/ijcatr1210.1004](https://doi.org/10.7753/ijcatr1210.1004)

### Aporte

Compara métricas de rendimiento y SEO entre aplicaciones React CSR y Next.js, demostrando mejoras en tiempo de carga inicial y crawlability gracias al pre-renderizado y al enrutamiento basado en archivos.

### Comparación

| Criterio | React CSR | Next.js (proyecto) |
|----------|-----------|-------------------|
| FCP / SEO | Inferior en pruebas Lighthouse | App Router + build optimizado |
| Enrutamiento | React Router manual | `frontend/src/app/(shell)/` |
| Code splitting | Manual | Automático por ruta Next.js |

### Aplicación al proyecto

El comando `next dev --turbopack -p 3029` en `package.json` y la estructura `src/app/(shell)/page.tsx` implementan el patrón que el artículo recomienda: framework React con optimizaciones de entrega. El shell único carga 14 secciones para `admin`, 10 para `docente` y 6 para `estudiante` sin navegación multipágina tradicional.

---

## Artículo 2

**Referencia:** Mahendra, I. G. A. S., & Putri, R. N. (2023). Load Time Optimization on React Website using Incremental Static Regeneration with NextJS. *JELIKU*, 12(2).  
**DOI:** [10.24843/jlk.2023.v12.i02.p20](https://doi.org/10.24843/jlk.2023.v12.i02.p20)

### Aporte

Mide mejora del ~24,5 % en First Contentful Paint al migrar de React CSR a Next.js con ISR; Lighthouse pasa de 72 a 92 en Performance Score.

### Comparación

| Métrica | React solo | Next.js ISR |
|---------|------------|-------------|
| Performance Score | 72 | 92 |
| FCP | +0,2 s más lento | Mejor en pruebas |

### Aplicación al proyecto

Aunque el dashboard es mayoritariamente dinámico (`"use client"` en `page.tsx`), Next.js 16 reduce el bundle inicial frente a un CRA equivalente. Vistas como `ReportsView` y `PredictionView` se montan bajo demanda dentro del shell, alineado con la estrategia de carga diferida que el artículo valida empíricamente.

---

## Artículo 3

**Referencia:** Sharma, A., et al. (2024). The Impact of Server-Side Rendering on UI Performance and SEO. *International Journal of Scientific Research in Computer Science Engineering and Information Technology*, 10(5), 795–804.  
**DOI:** [10.32628/CSEIT241051067](https://doi.org/10.32628/CSEIT241051067)

### Aporte

Analiza SSR, SSG e híbridos en frameworks como Next.js; documenta reducción de Time to First Contentful Paint y mejor indexación frente a SPAs puras.

### Comparación

| Modo | Uso típico | En Tesis Dashboard |
|------|------------|-------------------|
| SSR | Contenido dinámico por usuario | Layout shell + datos vía `api.ts` |
| CSR | Dashboard interactivo | Componentes `"use client"` |
| Híbrido | Mejor de ambos | App Router Next.js 16 |

### Aplicación al proyecto

`AuthProvider` hidrata sesión JWT en cliente; las peticiones a `/api/*` del backend Express complementan el modelo híbrido descrito en el artículo. `frontend/src/services/api.ts` centraliza `Authorization: Bearer`, equivalente al flujo post-SSR de datos autenticados.

---

## Artículo 4

**Referencia:** Sutrisna, I. K., et al. (2024). Comparison of Web Page Rendering Methods Based on Next.js Framework Using Page Loading Time Test. *Teknika*, 13(1), 102–108.  
**DOI:** [10.34148/teknika.v13i1.769](https://doi.org/10.34148/teknika.v13i1.769)

### Aporte

Compara CSR, SSR y SSG en Next.js midiendo tiempos de renderizado; SSG obtiene hasta 57 % menos tiempo que CSR en páginas de autenticación.

### Comparación

| Método | Tiempo relativo (auth) | Adecuación proyecto |
|--------|------------------------|---------------------|
| CSR | 422 ms (referencia) | Vistas post-login |
| SSR | 274 ms | Posible en layout |
| SSG | 180 ms | Assets estáticos / login |

### Aplicación al proyecto

La ruta de login y assets estáticos de Next.js se benefician de generación estática; el dashboard académico post-autenticación opera en CSR controlado por `ROLE_SECTIONS` en `page.tsx` líneas 54–90, decisión coherente con el hallazgo del artículo: CSR aceptable cuando la interactividad domina tras la carga inicial.

---

## Artículo 5

**Referencia:** Paulsen, C. A., & Lindsay, E. K. (2024). Learning analytics dashboards (LADs): a systematic review of the literature. *Education and Information Technologies*, 29, 4275–4305.  
**DOI:** [10.1007/s10639-023-12401-4](https://doi.org/10.1007/s10639-023-12401-4)

### Aporte

Revisa 66 LADs publicados; identifica KPIs, visualizaciones temporales y necesidad de adaptar dashboards al rol del usuario (estudiante vs. instructor vs. administrador).

### Comparación

| Requisito LAD (literatura) | Implementación proyecto |
|----------------------------|-------------------------|
| KPIs agregados | `RoleDashboard`, `earlyAlertCount` |
| Gráficos temporales | Recharts en `PredictionView` |
| Rol del visualizador | `ROLE_SECTIONS` 14/10/6 secciones |

### Aplicación al proyecto

`frontend/src/components/dashboard/RoleDashboard.tsx` y vistas `AlertsView`, `PredictionView`, `ReportsView` materializan los patrones de LAD que el artículo sistematiza. Recharts (`package.json`) es la librería de gráficos usada en módulos de predicción e historial, coincidiendo con la tendencia de dashboards educativos web documentada en la revisión.

---

## Artículo 6

**Referencia:** Autores varios (2024). A Data-Oriented Academic Burnout Monitoring and Assessment System Based on Student Academic Behavior. *International Journal of Innovative Research in Technology*, 12(10).  
**DOI:** [10.64643/ijirtv12i10-194282-459](https://doi.org/10.64643/ijirtv12i10-194282-459)

### Aporte

Describe arquitectura de tres capas con **React SPA**, Express REST, MySQL y layouts por rol — stack casi idéntico al implementado, orientado a monitoreo académico conductual.

### Comparación

| Capa | Paper | Tesis Dashboard |
|------|-------|-----------------|
| Presentación | React + Tailwind + Axios | Next.js + Tailwind 4 + `api.ts` |
| Lógica | Express REST | Express `:4000` |
| Datos | MySQL relacional | MySQL vía Prisma |
| Roles | Estudiante / facultad / admin | `admin` / `docente` / `estudiante` |

### Aplicación al proyecto

`StudentPredictionView`, `StudentLMSView` y `ProfessorPredictionView` exponen las mismas categorías de indicadores que el sistema del artículo (asistencia, tareas, actividad LMS). La decisión de React-family + REST no es arbitraria: replica un diseño validado en literatura reciente de monitoreo académico.

---

## Conclusión

La selección de **Next.js 16 sobre React plano** se sustenta en evidencia empírica de mejor FCP, SEO y modos de renderizado híbridos (DOI 10.7753/ijcatr1210.1004, 10.24843/jlk.2023.v12.i02.p20, 10.34148/teknika.v13i1.769). **Recharts** y la segmentación por rol responden a requisitos sistematizados de Learning Analytics Dashboards (10.1007/s10639-023-12401-4). El patrón React + REST + dashboards por rol está alineado con sistemas académicos publicados (10.64643/ijirtv12i10-194282-459), aplicado en este proyecto mediante `ROLE_SECTIONS`, servicios tipados y validación Zod en formularios del shell `(shell)/page.tsx`.
