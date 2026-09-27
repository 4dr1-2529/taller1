# Evidencias — Seguridad

Barridos y comprobaciones de seguridad ejecutados en la auditoría técnica del **2026-09-26** y
**revalidados el 2026-09-27** (clasificación de placeholders corregida).

> Los valores sensibles **nunca** se imprimen ni se almacenan aquí: solo rutas de fichero, longitudes y
> conteos.

## Evidencias vigentes (V6)

| Fichero | Contenido |
|---------|-----------|
| `barrido-secretos-20260926.json` | Barrido estático de patrones de credenciales (re-ejecutado 2026-09-27) sobre **4508 ficheros** del árbol de trabajo — 943 versionados por git. Patrones: tokens GitHub, AWS, Sonar, claves PEM, claves Stripe, `JWT_SECRET` **clasificado** (placeholder / generado en runtime / referencia / candidato real), `DATABASE_URL` clasificada y literales de contraseña. Reporta **solo ficheros, conteos y si están trackeados**: no almacena valores. |
| `difusion-secretos-documentados-20260926.json` | Cuántos ficheros trackeados contienen cada uno de los valores hallados (difusión), sin almacenar el valor, con la clasificación de cada hallazgo. |

## Hallazgos (revalidados 2026-09-27)

1. **`JWT_SECRET`: placeholder confirmado, cero secretos reales versionados.**
   - `backend/.env.example` (idéntico en `origin/main` y en `chore/system-audit-v6`) contiene
     `JWT_SECRET=<GENERAR_SECRETO_ALEATORIO_DE_AL_MENOS_64_CARACTERES>`: **es un placeholder de
     documentación**, no un secreto. Sus 53 caracteres son los del propio texto entre `<…>`.
   - El mismo texto aparece en tres documentos históricos (`legacy/documentation/README.md`,
     `legacy/documentation/backend/README.md`, `legacy/documentation/docs/DEPLOY.md`), también como
     placeholder.
   - Los dos únicos usos restantes de `JWT_SECRET=` en el repositorio **generan el valor en ejecución**:
     `.github/workflows/ci.yml` (aleatorio en el job de CI) y
     `backend/tests/fixtures/definitive-domain-equivalence.mjs` (aleatorio por ejecución de pruebas).
   - **Resultado: `jwt_secret_real_versionado = 0`.** El barrido original clasificó el placeholder como
     «JWT_SECRET con valor» (falso positivo); la lógica de clasificación se corrigió y la evidencia se
     regeneró. En consecuencia **la rotación del secreto de producción no puede recomendarse como
     obligatoria basándose en este hallazgo**. El **valor productivo no fue inspeccionado** (las
     variables de entorno de Railway no son legibles desde este entorno).
2. Contraseñas demo históricas documentadas en `legacy/documentation/README.md`,
   `AUDITORIA_FINAL_PROYECTO.md` y `database/blenkir-v3/README.md` (población demo ya deshabilitada).
3. `DATABASE_URL` en documentación: **7 sin password** (`mysql://root@localhost:3306/…`) y
   **1 con password placeholder** (`SU_CLAVE`); **0 con una clave real**.
4. **Sin** tokens `ghp_`/`github_pat_`, `AKIA…`, `squ_…`, claves PEM ni `sk_live_…` en el repositorio.
5. `password_literal` (patrón heurístico, **71 coincidencias**): pruebas, validadores, scripts y
   documentación. La revisión manual de los ficheros de código productivo detectados
   (`backend/src/validators/schemas.ts`, `backend/src/services/student-registration.service.ts`,
   `backend/prisma/bootstrap-admin.ts`) muestra esquemas de validación, valores generados y una
   referencia a `process.env.ADMIN_PASSWORD` con su ejemplo de uso en el comentario — **no una
   credencial de producción en claro**.

## Qué guardar aquí

| Tipo | Ejemplo |
|------|---------|
| Barrido de secretos | `barrido-YYYYMMDD.json` (o re-ejecución del vigente con fecha en `actualizado`) |
| Informe de dependencias (si se ejecuta) | `dependencias-YYYYMMDD.json` |
| Evidencia de rotación de secretos | `rotacion-secretos-YYYYMMDD.md` (sin valores) |

## Referencia

[Estado actual V6 — Seguridad](../../ESTADO_ACTUAL_V6.md) ·
[ISO 25010 — Seguridad](../../iso-25010/calidad-software.md)
