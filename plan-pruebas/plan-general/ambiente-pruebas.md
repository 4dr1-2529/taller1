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
npm run db:seed:demo
npm run ml:train
```

---

## Producción (smoke post-despliegue)

| Servicio | URL |
|----------|-----|
| Frontend | https://taller1-frontend.vercel.app |
| Backend | https://taller1-production.up.railway.app/api/v1 |
| Health | https://taller1-production.up.railway.app/health |

---

## Credenciales

Contraseña: **`mbappe29`**

| Rol | Email |
|-----|-------|
| Director | `director@blenkir.edu.pe` |
| Profesor | `pro50000001@blenkir.edu.pe` |
| Estudiante | `mateo.quispe0001@blenkir.edu.pe` |

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
