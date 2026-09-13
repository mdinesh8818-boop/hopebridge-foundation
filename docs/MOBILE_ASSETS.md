# Mobile branding assets — required before store submission

HopeBridge currently has web branding (`public/icon.svg`, emerald/ivory product chrome). Store builds need **raster** assets at fixed sizes. Do **not** invent unrelated branding.

## Available in repo today

| Asset | Path | Notes |
|-------|------|-------|
| Vector icon | `public/icon.svg` | Suitable for web/PWA reference; **not** App Store 1024 PNG |
| Hero visual | `public/hopebridge-hero-visual.png` | Marketing visual — not a launcher icon |
| Splash color | `#0d5f44` | Used in Capacitor SplashScreen / theme |

## Required before Apple / Google submission

Produce these from HopeBridge branding (logo mark on emerald or ivory):

| Asset | Size | Format | Use |
|-------|------|--------|-----|
| App Store icon | **1024×1024** | PNG, **no alpha** | App Store Connect |
| Android adaptive foreground | **1024×1024** (or 512) | PNG with transparent safe zone | Play Console / adaptive icon |
| Android adaptive background | **1024×1024** | Solid `#0d5f44` or branded | Play Console |
| Feature graphic (Play) | **1024×500** | PNG/JPG | Store listing |
| iOS splash / launch storyboard | Follow Xcode asset catalog | — | Generated/edited in Xcode after sync |
| PWA icons (recommended) | **192×192**, **512×512** PNG | PNG | `manifest.webmanifest` (SVG alone is incomplete for some installers) |

## Capacitor asset placement (after design delivery)

- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset`
- Android: `android/app/src/main/res/mipmap-*` (+ adaptive `mipmap-anydpi-v26`)
- Optional: `@capacitor/assets` generator once master 1024 icon exists

## Not generated in this PR

Low-quality placeholder PNGs were intentionally **not** invented. Supply design-approved masters, then sync into native projects on a Mac/Android Studio machine.
