# Mobile & store distribution preparation

HopeBridge is a responsive web application with Progressive Web App (PWA) metadata.

## Current status (this branch)

- `public/manifest.webmanifest` — installable web app metadata (`standalone`, theme `#0d5f44`, ivory background)
- Root layout declares `manifest` + `appleWebApp` metadata
- Responsive public navigation and authenticated dashboard layouts
- **Not claimed as published** on the Apple App Store or Google Play

## PWA next steps

1. Add PNG icons (192 / 512) in addition to `/icon.svg`
2. Optionally add a service worker for offline shell caching (not required for first launch)
3. Validate installability with Chrome Application panel / Lighthouse
4. Test safe-area padding on notched iOS devices

## iOS App Store packaging (remaining real-world steps)

HopeBridge can be packaged with a web-wrapper approach (for example Capacitor) pointing at the hosted app URL.

Remaining steps (not completed here, and not merged from draft mobile PRs):

1. Create an Apple Developer account and App Store Connect listing
2. Configure a native shell (Capacitor iOS or equivalent) with bundle ID, icons, splash screens
3. Implement any required App Transport / ATS and sign-in redirect handling
4. Archive, notarize/sign, submit for App Review
5. Only then claim App Store availability

Do **not** duplicate unfinished Capacitor work from separate draft PRs into this public-website branch unless intentionally coordinated.

## Google Play packaging (remaining real-world steps)

1. Create a Google Play Console listing
2. Configure an Android web-wrapper shell with application ID, icons, and signing keys
3. Produce an AAB, complete store questionnaire / Data safety form
4. Submit for review
5. Only then claim Play Store availability

## Important honesty rule

Until store submission and approval actually occur, product copy must not claim HopeBridge is available on the App Store or Google Play.
