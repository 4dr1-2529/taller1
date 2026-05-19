# Tesis Dashboard v2.0

**Modelo predictivo basado en ensemble learning para la identificación del riesgo de deserción estudiantil** — fusión de datos académicos y comportamiento en LMS.

Institución: **I.E.P. Blenkir Huancayo · Perú**

## Arquitectura

| Servicio | Puerto | Tecnología |
|----------|--------|------------|
| Frontend | 3029 | Next.js 16, React 19, Tailwind 4 |
| Backend API | 4000 | Express, Prisma, JWT |
| ML Service | 5000 | FastAPI, scikit-learn, XGBoost |

```
tesis-dashboard/
├── src/                    # Frontend (Next.js)
├── backend/                # API REST + Prisma
├── ml-service/             # Modelos IA (RF, XGB, Stacking)
├── database/postgresql/    # Esquema SQL producción + DER
└── docs/                   # Arquitectura y documentación
```

## Inicio rápido

### 1. Dependencias

```bash
npm install
cd backend && npm install && cd ..
pip install -r ml-service/requirements.txt
```

### 2. Base de datos

```bash
cp backend/.env.example backend/.env
npm run db:push
npm run db:seed
```

### 3. Entrenar modelos IA

```bash
npm run ml:train
```

### 4. Ejecutar todo (frontend + API + ML)

```bash
npm run dev
```

- **App:** http://localhost:3029  
- **API:** http://localhost:4000/api/v1  
- **ML:** http://localhost:5000/docs  

### Credenciales demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@iep-huancayo.edu.pe | Tesis2026! |
| Docente | docente@iep-huancayo.edu.pe | Tesis2026! |
| Tutor | tutor@iep-huancayo.edu.pe | Tesis2026! |
| Psicólogo | psicologo@iep-huancayo.edu.pe | Tesis2026! |
| Estudiante | estudiante@iep-huancayo.edu.pe | Tesis2026! |

## Funcionalidades

- Dashboard analítico con KPIs y gráficos Recharts
- Predicción de riesgo (bajo / medio / alto) con interpretabilidad
- Ensemble ML: Random Forest, XGBoost, Stacking
- Alertas tempranas y recomendaciones automáticas
- JWT + roles (admin, docente, tutor, psicólogo, estudiante)
- Base de datos normalizada con auditoría y trazabilidad
- Exportación PDF / Excel
- Modo claro / oscuro
- Chat interno (API)

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md)
- [DER](docs/DER.md)
- [API](docs/API.md)
- Esquema PostgreSQL: `database/postgresql/schema.sql`

## Variables de entorno

Copie `.env.example` y `backend/.env.example` y ajuste `JWT_SECRET` en producción.

## Tesis

Sistema desarrollado como proyecto universitario avanzado — software escalable tipo SaaS educativo con IA explicable y persistencia real.
