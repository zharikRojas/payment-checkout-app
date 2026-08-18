# Web (apps/web)

SPA React + Vite del checkout (Fase 4).

## Español

```bash
# desde la raíz del monorepo
npm install
cp apps/web/.env.example apps/web/.env
# Solo hace falta VITE_API_URL (tokenize va por el API)
npm run dev:api
npm run dev:web
```

- API en `http://localhost:3000`
- Web en `http://localhost:5173`
- Tests: `npm run test -w apps/web`
- Build: `npm run build -w apps/web`

## English

```bash
# from monorepo root
npm install
cp apps/web/.env.example apps/web/.env
# Only VITE_API_URL is required (tokenize is proxied by the API)
npm run dev:api
npm run dev:web
```

- API at `http://localhost:3000`
- Web at `http://localhost:5173`
- Tests: `npm run test -w apps/web`
- Build: `npm run build -w apps/web`
