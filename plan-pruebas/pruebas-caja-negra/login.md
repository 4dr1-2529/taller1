# Pruebas caja negra — Login

**Página:** `frontend/src/app/(auth)/login/page.tsx` · **API:** `POST /api/v1/auth/login`

---

## Elementos UI reales

| Elemento | Selector / ID | Caso |
|----------|---------------|------|
| Email | `#login-email` | TC-FE-01 |
| Password | `#login-password` | TC-FE-01 |
| Submit | botón "Ingresar al panel" | TC-FE-02 |
| Branding | texto predicción deserción | TC-CN-01 |

---

## Casos

| ID | Entrada | Resultado esperado | Evidencia / test |
|----|---------|-------------------|------------------|
| TC-CN-01 | Abrir `/login` | Formulario visible | login-pantalla-inicial.png |
| TC-BE-02 | director@blenkir.edu.pe + DEMO_PASSWORD | 200 + JWT | smoke login + schemas |
| TC-BE-03 | email inválido `x` | Zod fail / 401 | schemas.test.ts |
| TC-FE-09 | invalido@ + wrongpass | Toast Sonner error | login-error-controlado.png |
| TC-INT-08 | Token en `api.ts` header | `Authorization: Bearer` | post-login requests |

---

## Roles post-login (`AuthUser.role`)

Redirige a `(shell)/page.tsx` con secciones según `ROLE_SECTIONS[role]` — admin 14, docente 10, estudiante 6.
