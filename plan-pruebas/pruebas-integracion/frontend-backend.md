# Pruebas de integración — Frontend → Backend

**Smoke:** `npm run test:smoke` · **UI:** `PredictionView` + `api.ts`

---

## Flujo login → datos

```
login/page.tsx → api.login() → POST /auth/login
  → localStorage token → api.hasToken = true
  → useAcademicData → GET /students, /dashboard/kpis, ...
  → (shell)/page.tsx renderSection()
```

| Paso | API call (`api.ts`) | Caso |
|------|---------------------|------|
| 1 | `login(email, password)` | TC-INT-08 |
| 2 | `getMe()` → `/auth/me` | TC-FE-02 |
| 3 | `getDashboardKpis()` | TC-INT-02 smoke |
| 4 | `getStudents(1, 100)` | TC-INT-05 |

---

## Predicción UI → API

`PredictionView.runApiPrediction()` (L100–127):

- Director: `api.predict(student.id)` → `POST /predict`
- Docente: `profesorService.predict()` → `POST /profesor/predicciones`
- Requiere `useApi && api.hasToken` — botón deshabilitado si no hay token

**Precondición UI:** `selectFirstSeccion` — sin `filters.seccionId` muestra `FILTER_HINTS.selectSeccion`.

---

## Evidencia smoke + captura

- `smoke-tests.mjs`: login → `/dashboard/kpis` → `/predictions` → `/alerts`
- `prediccion-resultado-riesgo.png`
