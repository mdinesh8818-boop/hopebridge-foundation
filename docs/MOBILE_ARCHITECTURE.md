# Mobile architecture — Capacitor remote-hosted Next.js

## Decision

**Selected architecture:** Capacitor native shell + **remote-hosted** HopeBridge Next.js deployment.

```
Next.js web app (Vercel)  <—— HTTPS ——  Capacitor iOS / Android WebView
   API routes / AI
   Firebase Auth
   Firestore
```

## Why not static export?

HopeBridge uses server capabilities that break under `output: 'export'`:

- `/api/ai-assistant/*` OpenAI proxy (API key must stay server-side)
- Next.js dynamic server rendering / route handlers
- Auth cookie + middleware (`src/proxy.ts`) flows
- Live Firebase/Firestore client against secured rules

Forcing static export would remove AI and weaken the security model.

## Why not React Native rewrite?

A separate RN app would duplicate modules, auth, Firestore scoping, and AI context. Capacitor reuses the working product UI while enabling App Store / Play distribution.

## Capacitor version

`@capacitor/core` / CLI / ios / android **8.5.2** (current stable at implementation time).

## App identity (temporary)

| Field | Value | Notes |
|-------|-------|-------|
| App name | HopeBridge | Product name |
| appId / Bundle ID | `com.hopebridge.app` | **Temporary development ID** — confirm final commercial Bundle ID / applicationId before store submission |
| Launch URL | `CAPACITOR_SERVER_URL` / `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` / `https://hopebridge-foundation-five.vercel.app` | Must be HTTPS production/stable deploy |

## Native launch behavior

Inside the Capacitor shell, `/` redirects to:

- unauthenticated → `/auth/login`
- authenticated → access-aware destination (`/dashboard`, `/onboarding`, `/auth/pending`, `/auth/disabled`)

Public marketing remains for normal browsers.

## Security

Mobile uses the **same** Firebase Auth, Firestore rules, organizationId scoping, and roles as web. No mobile bypass. `OPENAI_API_KEY` never ships in the app binary.

## Exports / downloads

Web continues to use blob download anchors.

Inside Capacitor, CSV exports prefer **Capacitor Share** (`src/lib/fileExport.ts`) so content can leave the WebView. True file-system writes can be added later via `@capacitor/filesystem` without changing web behavior.

## Commands

```bash
npm run mobile:sync      # npx cap sync
npm run mobile:ios       # open Xcode (macOS)
npm run mobile:android   # open Android Studio
```

See `docs/APP_STORE_READINESS.md`, `docs/GOOGLE_PLAY_READINESS.md`, and `docs/MOBILE_ASSETS.md`.
