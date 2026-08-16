# payment-checkout-app

## Español

Monorepo npm workspaces (Fase 1): API NestJS + web Vite/React + PostgreSQL.

### Requisitos

- Node.js (npm workspaces)
- Docker (opcional, para la base de datos)

### Variables de entorno

Copia `.env.example` a `.env` y ajusta si hace falta.

**Pagos (pasarela sandbox):** rellena `PAYMENT_API_URL` (desde el enunciado de la prueba), `PAYMENT_PUBLIC_KEY`, `PAYMENT_PRIVATE_KEY`, `PAYMENT_INTEGRITY_SECRET` y `PAYMENT_EVENTS_SECRET` (placeholders en `.env.example`). URL del webhook: `POST http://localhost:3000/webhooks/payments` (exponer con túnel en local).

### Base de datos

```bash
docker compose up -d
```

PostgreSQL en `localhost:5433` → container `:5432` (usuario/password/db: `checkout`).

### API

```bash
npm install
cp .env.example .env && cp .env apps/api/.env   # si aún no existen
docker compose up -d
cd apps/api && npx prisma migrate dev --name init_domain && npx prisma db seed && cd ../..
npm run dev:api
```

Health: `GET http://localhost:3000/health` → `{ "status": "ok" }`

Swagger: `http://localhost:3000/docs`

Endpoints dominio: `GET /products`, `GET /products/:id`, `POST /customers`, `POST /deliveries`, `POST /transactions`, `GET /transactions/:id`, `POST /transactions/:id/pay`, `POST /webhooks/payments`

Cobertura: tests unitarios de use cases (Fase 2–3); ≥85% en Fase 5

### Web

```bash
npm run dev:web
```

URL local: _http://localhost:5173_ (placeholder)

### Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev:api` | API en modo watch |
| `npm run dev:web` | Frontend Vite |
| `npm run test:api` | Tests API |
| `npm run test:web` | Tests web |
| `npm run build:api` | Build API |
| `npm run build:web` | Build web |

---

## English

npm workspaces monorepo (Phase 1): NestJS API + Vite/React web + PostgreSQL.

### Requirements

- Node.js (npm workspaces)
- Docker (optional, for the database)

### Environment

Copy `.env.example` to `.env` and adjust as needed.

**Payments (payment provider sandbox):** set `PAYMENT_API_URL` (from the challenge brief), `PAYMENT_PUBLIC_KEY`, `PAYMENT_PRIVATE_KEY`, `PAYMENT_INTEGRITY_SECRET`, and `PAYMENT_EVENTS_SECRET` (placeholders in `.env.example`). Webhook URL: `POST http://localhost:3000/webhooks/payments` (use a tunnel locally).

### Database

```bash
docker compose up -d
```

PostgreSQL on `localhost:5433` → container `:5432` (user/password/db: `checkout`).

### API

```bash
npm install
cp .env.example .env && cp .env apps/api/.env   # if missing
docker compose up -d
cd apps/api && npx prisma migrate dev --name init_domain && npx prisma db seed && cd ../..
npm run dev:api
```

Health: `GET http://localhost:3000/health` → `{ "status": "ok" }`

Swagger: `http://localhost:3000/docs`

Domain endpoints: `GET /products`, `GET /products/:id`, `POST /customers`, `POST /deliveries`, `POST /transactions`, `GET /transactions/:id`, `POST /transactions/:id/pay`, `POST /webhooks/payments`

Coverage: use-case unit tests (Phase 2–3); ≥85% in Phase 5

### Web

```bash
npm run dev:web
```

Local URL: _http://localhost:5173_ (placeholder)

### Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev:api` | API watch mode |
| `npm run dev:web` | Vite frontend |
| `npm run test:api` | API tests |
| `npm run test:web` | Web tests |
| `npm run build:api` | Build API |
| `npm run build:web` | Build web |
