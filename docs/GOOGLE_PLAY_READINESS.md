# Google Play readiness — HopeBridge

HopeBridge Android packaging uses Capacitor (`android/` project). This is **preparation**, not submission.

## Required Google accounts / tooling

1. **Google Play Console** developer account
2. **Android Studio** (current stable)
3. JDK matching Android Gradle plugin requirements

## Identifiers

| Item | Current / temporary | Action before submit |
|------|---------------------|----------------------|
| applicationId | `com.hopebridge.app` | Confirm final commercial ID; update Capacitor `appId` + Android `applicationId` |
| App name | HopeBridge | Confirm listing title |

## Signing

- Create an upload keystore (keep offline backup; never commit)
- Configure Play App Signing
- Build **Android App Bundle** (`.aab`), not only APK, for Play upload

## Store listing assets

- High-res icon **512×512**
- Feature graphic **1024×500**
- Phone screenshots (and tablet if targeting tablets)
- Short description / full description
- Privacy Policy URL
- Support email / URL

## Data Safety / content rating

Complete Play Data Safety form covering:

- Account info
- Nonprofit operational data (donors, beneficiaries, etc.)
- AI prompts/responses processed via backend
- Approximate location only if ever collected (currently not required)

Complete content rating questionnaire.

## Testing tracks

1. Internal testing
2. Closed testing
3. Production staged rollout

## Build commands

```bash
npm install
npm run mobile:sync
npm run mobile:android
# In Android Studio: Build → Generate Signed Bundle / APK → Android App Bundle
```

CLI alternative (once signing is configured):

```bash
cd android && ./gradlew bundleRelease
```

## Minimum functionality (Play)

Play also expects meaningful utility. HopeBridge’s authenticated nonprofit management + AI assistant satisfy that bar better than a marketing WebView.

## Not done in this PR

- Play Console enrollment
- Final applicationId confirmation
- Keystore creation
- Listing graphics
- Production upload
