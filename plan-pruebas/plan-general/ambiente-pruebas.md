# Ambiente de pruebas

---

## Local (principal — evidencias)

| Servicio | URL / puerto | Comando |
|----------|--------------|---------|
| Frontend | http://localhost:3029 | `npm run dev:web` |
| Backend API | http://localhost:4000/api/v1 | `npm run dev:api` |
| ML | http://localhost:5000 | `npm run dev:ml` |
| MySQL | localhost:3306 · `tesis_dashboard` | XAMPP |

### Variables

- `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`
- `backend/.env` → `DATABASE_URL` apuntando a MySQL local

### Datos demo

```bash
npm run db:push
npm run db:seed
# db:seed:demo DESHABILITADO (legacy-population-disabled.mjs): no puebla la BD
npm run ml:train
```

---

## Producción (smoke post-despliegue)

| Servicio | URL |
|----------|-----|
| Frontend | https://taller1-frontend.vercel.app |
| Backend | https://backend-production-fcb1.up.railway.app/api/v1 |
| Health | https://backend-production-fcb1.up.railway.app/health |

---

## Credenciales

Contraseñas: **solo variables de entorno** en Railway (`TALLER1` → `production` → servicio `backend`):
`DIRECTOR_INITIAL_PASSWORD`, `TEACHER_INITIAL_PASSWORD`, `STUDENT_INITIAL_PASSWORD`. No se publican valores.

| Rol | Email |
|-----|-------|
| Director | `director@blenkir.edu.pe` |
| Profesor | `prof001@blenkir.edu.pe` |
| Estudiante | `est0002@alumnos.blenkir.edu.pe` |

Listado completo: [docs/cuentas-demo/](../../docs/cuentas-demo/README.md)

---

## Herramientas

| Herramienta | Uso |
|-------------|-----|
| Jest | Tests backend |
| pytest | Tests ML |
| Playwright (Edge) | Capturas UI — `scripts/evidence/` |
| Postman | Colección [docs/postman/](../../docs/postman/tesis-dashboard.postman_collection.json) |

Guía despliegue: [docs/DEPLOY.md](../../docs/DEPLOY.md)
