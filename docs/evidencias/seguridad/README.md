# Evidencias — Seguridad

Barridos y comprobaciones de seguridad ejecutados en la auditoría técnica del **2026-09-26**.

> Los valores sensibles **nunca** se imprimen ni se almacenan aquí: solo rutas de fichero, longitudes y
> conteos.

## Evidencias vigentes (V6)

| Fichero | Contenido |
|---------|-----------|
| `barrido-secretos-20260926.json` | Barrido estático de patrones de credenciales en 4431 ficheros: tokens GitHub, AWS, Sonar, claves PEM, claves Stripe, `JWT_SECRET` con valor, `DATABASE_URL` con contraseña y literales de contraseña. Reporta **solo ficheros y conteos**. |
| `difusion-secretos-documentados-20260926.json` | Cuántos ficheros trackeados contienen cada uno de los valores hallados (difusión), sin almacenar el valor. |

## Hallazgos

1. `backend/.env.example` (trackeado) contiene un `JWT_SECRET` de 53 caracteres que se repite en tres
   documentos históricos. **No es comprobable** si coincide con el valor de producción (las variables de
   entorno de Railway no son legibles desde este entorno) → **se recomienda rotarlo**.
2. Contraseñas demo históricas documentadas en `legacy/documentation/README.md`,
   `AUDITORIA_FINAL_PROYECTO.md` y `database/blenkir-v3/README.md` (población demo ya deshabilitada).
3. Los `DATABASE_URL` aparecidos en documentación son URLs locales sin contraseña.
4. **Sin** tokens `ghp_`/`github_pat_`, `AKIA…`, `squ_…`, claves PEM ni `sk_live_…` en el repositorio.

## Qué guardar aquí

| Tipo | Ejemplo |
|------|---------|
| Barrido de secretos | `barrido-secretos-YYYYMMDD.json` |
| Informe de dependencias (si se ejecuta) | `dependencias-YYYYMMDD.json` |
| Evidencia de rotación de secretos | `rotacion-secretos-YYYYMMDD.md` (sin valores) |

## Referencia

[Estado actual V6 — Seguridad](../../ESTADO_ACTUAL_V6.md) ·
[ISO 25010 — Seguridad](../../iso-25010/calidad-software.md)
