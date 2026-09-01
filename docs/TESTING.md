# HopeBridge Testing

## Route smoke check

```bash
npm run test:routes
```

Verifies that every expected `page.tsx` route file exists.

## Playwright E2E

```bash
npm run test:e2e
```

By default, Playwright runs `npm run build` and starts the production server on port 3000.

### Authenticated tests

Set these environment variables to enable login, sidebar navigation, AI chip, and campaign modal tests:

- `HOPEBRIDGE_E2E_EMAIL`
- `HOPEBRIDGE_E2E_PASSWORD`

Without credentials, authenticated specs are **skipped** (public and auth-guest tests still run).

### Using an existing server

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npm run test:e2e
```

## Quality gates

```bash
npx tsc --noEmit
npm run lint
npm run build
```
