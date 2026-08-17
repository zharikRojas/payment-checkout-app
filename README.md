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

Endpoints dominio: `GET /products`, `GET /products/:id`, `POST /customers`, `POST /deliveries`, `POST /transactions`, `GET /transactions/:id`, `POST /transactions/:id/pay`, `POST /payments/card-tokens`, `POST /webhooks/payments`

**Cobertura (líneas, Jest):** API **98.27%** · web **97.05%** (`npm run test:cov:api` / `test:cov:web`). Umbral CI: ≥85%. En API se miden use cases, gateway sandbox y unwrap; no Prisma ni `main.ts` (I/O). En web se miden módulos TS (slice, card, api); no componentes TSX.

**Seguridad HTTP:** Helmet + CORS allowlist (`WEB_ORIGIN` separado por comas) + CSP en el `index.html` de la SPA (más laxo en `vite dev` por HMR).

**npm audit:** quedan avisos high en dependencias transitivas (`prisma`/`deepmerge-ts`, `@nestjs/swagger`/`js-yaml`). No se aplicó `audit fix --force` (bajaba Prisma). No afectan el runtime del checkout; revisar en un bump de esas libs.

### Web

```bash
npm install
cp apps/web/.env.example apps/web/.env
# Solo VITE_API_URL (la tokenización va por el API)
npm run dev:api   # en otra terminal, API arriba
npm run dev:web
```

URL local: _http://localhost:5173_

Flujo: listado → producto → checkout → resumen → procesamiento (polling) → resultado.

### Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev:api` | API en modo watch |
| `npm run dev:web` | Frontend Vite |
| `npm run test:api` | Tests API |
| `npm run test:web` | Tests web |
| `npm run test:cov:api` | Coverage API |
| `npm run test:cov:web` | Coverage web |
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

Domain endpoints: `GET /products`, `GET /products/:id`, `POST /customers`, `POST /deliveries`, `POST /transactions`, `GET /transactions/:id`, `POST /transactions/:id/pay`, `POST /payments/card-tokens`, `POST /webhooks/payments`

**Coverage (lines, Jest):** API **98.27%** · web **97.05%** (`npm run test:cov:api` / `test:cov:web`). CI threshold: ≥85%. API measures use cases, sandbox gateway, and unwrap; not Prisma or `main.ts`. Web measures TS modules (slice, card, api), not TSX components.

**HTTP security:** Helmet + CORS allowlist (`WEB_ORIGIN` comma-separated) + CSP meta on the SPA `index.html` (looser in `vite dev` for HMR).

**npm audit:** remaining high findings are transitive (`prisma`/`deepmerge-ts`, `@nestjs/swagger`/`js-yaml`). Did not run `audit fix --force` (it would downgrade Prisma). Not in the checkout runtime path; revisit on a library bump.

### Web

```bash
npm install
cp apps/web/.env.example apps/web/.env
# Only VITE_API_URL is required (tokenize is proxied by the API)
npm run dev:api   # separate terminal, API must be up
npm run dev:web
```

Local URL: _http://localhost:5173_

Flow: list → product → checkout → summary → processing (poll) → result.

### Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev:api` | API watch mode |
| `npm run dev:web` | Vite frontend |
| `npm run test:api` | API tests |
| `npm run test:web` | Web tests |
| `npm run test:cov:api` | API coverage |
| `npm run test:cov:web` | Web coverage |
| `npm run build:api` | Build API |
| `npm run build:web` | Build web |
