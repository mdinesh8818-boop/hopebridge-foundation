# Mobile / App Store roadmap

HopeBridge ships as a **Next.js web app** plus a **Capacitor remote-hosted native shell** (iOS/Android). This roadmap tracks what is done vs next.

## Done in Capacitor packaging phase

- Capacitor **8.5.2** with `ios/` + `android/` projects
- Remote-hosted architecture (no static export) — see `docs/MOBILE_ARCHITECTURE.md`
- Native launch skips marketing `/` → login / access-aware dashboard
- Status bar, splash, keyboard resize, network banner, external links via Browser
- PWA manifest (`standalone`, start at `/auth/login`)
- CSV export falls back to Capacitor Share on native
- Store readiness docs (Apple, Google, privacy, subscriptions-future, assets)

## Near-term polish (before store QA)

- Design-approved **1024** app icons + Play feature graphic (`docs/MOBILE_ASSETS.md`)
- Confirm production `CAPACITOR_SERVER_URL` / Bundle ID
- Phone QA: tables, AI chat keyboard, onboarding, pending/disabled screens
- Optional bottom tab bar for Dashboard / AI / Teams (drawer remains primary)

## Native features roadmap (do not overbuild)

| Feature | Status | Notes |
|---------|--------|-------|
| Status bar / splash / keyboard | Implemented | Low risk |
| External Browser for outbound links | Implemented | Core Strategy Resources etc. |
| Network failure banner | Implemented | Not full offline |
| Share text exports | Implemented | Filesystem plugin later for true files |
| Push notifications | Not started | Needs product events + FCM/APNs |
| Camera / photo upload | Not started | No permission until product need |
| Biometric unlock | Not started | Optional convenience after stable auth |
| Deep links / universal links | Stub listener only | Expand with verified domain |
| Offline cache | Not started | Out of scope for v1 |

## Store submission gate

Do **not** submit to App Store / Play until:

1. Firestore organization isolation rules are **published**
2. Organization migration / backfill completed for production
3. Preview QA for multi-org access passes
4. Privacy Policy + support URLs live
5. Final Bundle ID / applicationId confirmed

## Out of scope

- React Native rewrite
- Apple/Google IAP (see `docs/MOBILE_SUBSCRIPTIONS.md`)
- Automatic store submission from CI
