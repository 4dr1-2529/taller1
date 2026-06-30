# Pruebas de seguridad — JWT, roles, permisos

**Middleware:** `backend/src/middleware/auth.ts`

---

## JWT (`authenticate`)

| Condición | Código | HTTP | Caso |
|-----------|--------|------|------|
| Sin header | L15-16 | 401 "Token requerido" | TC-SEC-01 |
| No Bearer | mismo | 401 | TC-SEC-01 |
| jwt.verify falla | L27-28 catch | 401 "Token inválido o expirado" | TC-SEC-02 |
| Payload sin sub/role | L24-25 | 401 INVALID_TOKEN | — |
| Token válido | `req.user = decoded` | next() | TC-INT-08 |

**Payload tipo:** `{ sub, email, role: RolCodigo }` — `RolCodigo` = `admin | docente | estudiante`

---

## RBAC (`authorize(...roles)`)

```typescript
authorize("admin")           // POST /students
authorize("admin", "docente") // GET /grades
authorize("estudiante")      // GET /estudiante/notas
```

403 "Permiso denegado" si `!roles.includes(req.user.role)` — TC-SEC-03, TC-SEC-04.

---

## Permisos matriz (`permissions.test.mjs`)

| Rol | crearEstudiante | predecirSusEstudiantes | verPropioRiesgo | registrarNota |
|-----|-----------------|------------------------|-----------------|---------------|
| admin | true | — | — | — |
| docente | false | true | — | — |
| estudiante | false | — | true | false |

---

## Validaciones Zod (acceso indirecto)

- `changePasswordSchema` — contraseña débil rechazada TC-BE-10
- `createUserSchema` — solo roles `admin|docente|estudiante` TC-SEC-06

Ver [jwt.md](jwt.md) · [roles.md](roles.md) · [autenticacion.md](autenticacion.md)
