# Apple App Store readiness — HopeBridge

HopeBridge iOS packaging uses Capacitor (`ios/` project). This is **preparation**, not submission.

## Required Apple accounts / tooling

1. **Apple Developer Program** membership (organization account preferred for a nonprofit product)
2. Mac with current **Xcode**
3. **App Store Connect** access
4. Optional: TestFlight internal testers

## Identifiers

| Item | Current / temporary | Action before submit |
|------|---------------------|----------------------|
| Bundle Identifier | `com.hopebridge.app` | Confirm final commercial ID; update Xcode + Capacitor `appId` together |
| Display name | HopeBridge | Confirm marketing name |
| SKU | e.g. `hopebridge-ios` | Choose in App Store Connect |

## Signing

- Create App ID in Apple Developer → Identifiers
- Create distribution certificate + App Store provisioning profile
- In Xcode: Signing & Capabilities → Team + automatically manage signing (or manual profiles)

## Store listing assets (you must create)

- App icon **1024×1024** PNG (no alpha) — SVG in repo is not sufficient alone
- Screenshots for required device sizes (6.7", 6.1", etc. — follow current App Store Connect requirements)
- Optional preview video
- Support URL (public)
- Privacy Policy URL (public, legally reviewed)
- Marketing URL (optional)

## Copy / metadata to prepare

- App name, subtitle, description, keywords, category (likely Business / Productivity)
- Age rating questionnaire
- Privacy Nutrition Labels / data collection disclosures
- Review notes + **demo reviewer credentials** (active org admin on a sample nonprofit workspace)

## Minimum functionality (Apple)

Apple rejects “thin” website wrappers. HopeBridge should emphasize authenticated nonprofit workflows:

- Organization workspace onboarding
- Campaigns / programs / donors / volunteers / beneficiaries / teams
- Impact analytics
- Organization-scoped AI Assistant (server-backed)
- Role-based access (pending / active / disabled)

Document these in review notes.

## Build commands (Mac)

```bash
npm install
npm run mobile:sync
npm run mobile:ios
# In Xcode: select team, set Bundle ID, Product → Archive → Distribute App
```

## Not done in this PR

- Apple Developer enrollment
- Final Bundle ID confirmation
- Store screenshots / 1024 icon
- TestFlight upload
- App Review submission
