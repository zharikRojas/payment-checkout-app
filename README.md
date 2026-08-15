# payment-checkout-app

## Español

Monorepo npm workspaces (Fase 1): API NestJS + web Vite/React + PostgreSQL.

### Requisitos

- Node.js (npm workspaces)
- Docker (opcional, para la base de datos)

### Variables de entorno

Copia `.env.example` a `.env` y ajusta si hace falta.

### Base de datos

```bash
docker compose up -d
```

PostgreSQL en `localhost:5432` (usuario/password/db: `checkout`).

### API

```bash
npm install
npm run dev:api
```

Health: `GET http://localhost:3000/health` → `{ "status": "ok" }`

Swagger: _pendiente_

Cobertura: _pendiente_

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

### Database

```bash
docker compose up -d
```

PostgreSQL on `localhost:5432` (user/password/db: `checkout`).

### API

```bash
npm install
npm run dev:api
```

Health: `GET http://localhost:3000/health` → `{ "status": "ok" }`

Swagger: _TBD_

Coverage: _TBD_

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
