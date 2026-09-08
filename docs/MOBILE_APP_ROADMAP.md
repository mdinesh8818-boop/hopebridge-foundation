# Mobile / App Store roadmap

HopeBridge is a Next.js 16 web application. This document recommends the next practical path toward Apple App Store and Google Play presence **without** building a native rewrite in the current phase.

## Current readiness (web)

Already in good shape for a mobile-friendly SaaS shell:

- Responsive dashboard layouts and module pages
- Mobile sidebar / hamburger navigation (`HopeBridgeSidebar`)
- Touch-friendly primary actions on key forms
- Auth login/signup and onboarding flows usable on smaller screens
- Web app manifest metadata present (`manifest.webmanifest`, Apple web app title)

Remaining polish before store packaging:

- Audit dense tables (campaigns/donors) for horizontal scroll or card layouts on &lt;640px
- Ensure onboarding multi-step forms remain one-column on phones
- Verify AI Assistant chat composer with on-screen keyboards
- Confirm Firebase Auth email/password flows on iOS Safari and Android Chrome

## Options compared

### 1. Progressive Web App (PWA)

**What:** Installable web app via service worker + manifest; homescreen icon; offline shell optional.

**Pros:** Fastest path; single Next.js codebase; no store review for web distribution; reuses current UI.

**Cons:** Limited iOS background/push capabilities; not listed in App Store by default; discovery weaker than stores.

**Fit:** Excellent near-term improvement for staff who want “app-like” access from the browser.

### 2. Capacitor / native wrapper

**What:** Wrap the production web app (or a dedicated mobile route set) in a native WebView shell with Capacitor; ship to App Store / Play.

**Pros:** Reuses the existing Next.js UI; store listing; access to native plugins (push, biometrics, file picker) incrementally; smaller rewrite than React Native.

**Cons:** App Store review still required; WebView performance/UX nuances; some Apple guidelines scrutiny for “website wrappers” — mitigate with offline value, push, and polished mobile UX.

**Fit:** **Recommended next phase** for HopeBridge once web multi-org SaaS is stable.

### 3. React Native / fully native

**What:** Rebuild core modules in React Native (or native Swift/Kotlin).

**Pros:** Best native UX and performance; deepest platform integration.

**Cons:** Parallel product surface; highest cost; duplicates auth, Firestore, AI, and module logic unless a shared API layer is built first.

**Fit:** Later, only if Capacitor hits clear UX or performance limits for field volunteers.

## Recommended sequence

1. Keep shipping the responsive Next.js app (current work).
2. Harden PWA basics (manifest, icons, optional offline shell for authenticated routes).
3. Package with **Capacitor** pointing at the production HopeBridge URL or a mobile-optimized build.
4. Add store-oriented capabilities only as needed: secure token storage, push notifications for approvals, biometric unlock.
5. Revisit React Native only if product metrics justify a native rewrite.

## Store considerations (future)

- Apple: privacy nutrition labels, account deletion pathway, sign-in with Apple if offering third-party social login, clear nonprofit data use disclosures.
- Google Play: Data safety form, target API level, and background permission justifications.
- Do **not** submit store builds until Firestore organization isolation rules are deployed and Preview QA for multi-org is complete.

## Out of scope for this phase

- Native application implementation
- Store listing assets / submission
- Push notification infrastructure
