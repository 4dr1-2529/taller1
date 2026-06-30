# Pruebas de seguridad — Autenticación

**Casos:** TC-BE-02, TC-BE-03, TC-FE-07, TC-SEC-05

---

## Escenarios

| # | Entrada | Resultado |
|---|---------|-----------|
| 1 | Email + password correctos | 200 + tokens |
| 2 | Email inexistente | 401 |
| 3 | Password incorrecta | 401 + toast UI |
| 4 | Login desde Vercel prod | Sin error CORS |
| 5 | Rate limiting excesivo | 429 (si configurado) |

---

## Controles HTTP

- Helmet headers
- CORS configurado para frontend Vercel
- Rate limit en Express

---

## Evidencias

[docs/evidencias_finales/capturas/14-qa/login-error-controlado.png](../../docs/evidencias_finales/capturas/14-qa/login-error-controlado.png)
