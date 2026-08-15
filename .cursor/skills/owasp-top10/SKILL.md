---
name: owasp-top10
description: >
  Applies OWASP Top 10:2025 controls to payment-checkout-app (NestJS API + React
  SPA). Use when implementing authz, payments, webhooks, logging, headers,
  CORS, secrets, validation, error handling, or when the user mentions OWASP,
  security, HTTPS, Helmet, CSP, or hardening.
---

# OWASP Top 10:2025 — skill operativa

Fuente: https://owasp.org/Top10/2025/

## Checklist por cambio

Al tocar API/FE de checkout, verifica:

1. **A01 Access** — ¿quién puede mutar stock/tx? Solo use cases; IDs opacos.
2. **A02 Config** — ¿Helmet/CORS/HTTPS en el camino a prod?
3. **A03 Supply chain** — ¿nueva dep justificada? Preferir stdlib (ponytail).
4. **A04 Crypto** — ¿PAN/CVV en logs, persist, o localStorage? → eliminar.
5. **A05 Injection** — ¿Prisma + DTO validation?
6. **A06 Design** — ¿fees/stock server-side y fail-closed?
7. **A07 Authn** — guest OK; secrets solo env; nunca keys en repo.
8. **A08 Integrity** — ¿montos recalculados? ¿webhook verificado/idempotente?
9. **A09 Logging** — log `transactionId` + status; nunca tarjeta.
10. **A10 Exceptions** — timeouts; no confirmar stock si estado desconocido.

## Patrones mínimos

- API: `helmet()`, CORS allowlist, ValidationPipe whitelist.
- Pay path: token in, never raw card out to DB.
- Webhook: verify signature if provider supports; idempotent by `providerTxId`.
- FE: no `dangerouslySetInnerHTML`; persist sin card fields + aviso refresh.

## No hacer

- Inventar un framework de seguridad.
- Guardar enunciado/keys en README público.
