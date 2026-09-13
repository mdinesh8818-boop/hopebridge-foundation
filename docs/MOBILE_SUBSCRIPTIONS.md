# Mobile subscriptions (future)

**Status:** documentation only. Do **not** implement Apple/Google IAP in this release.

## Context

HopeBridge may later sell a SaaS subscription for nonprofit workspaces. That is separate from:

- Nonprofit **donation** collection flows (donors → campaigns)
- One-time platform fees charged outside app stores

## Why not ship IAP now

1. Product billing model is undecided (org seats vs flat plan vs usage).
2. Apple/Google require store billing for **digital** goods consumed in-app; web billing is restricted on iOS for many SaaS cases — legal/product review needed.
3. Current mobile shell is a remote WebView; payment UX should be designed once pricing is final.

## Options to evaluate later

| Approach | Notes |
|----------|--------|
| Web-only billing (Stripe) | Open account portal in system browser; avoid IAP if policy allows |
| Apple IAP + Google Play Billing | Required for many in-app unlocks; ~30% fees; entitlement sync to Firestore |
| Hybrid | Free core app + paid web admin seats |

## Do not

- Add StoreKit / Play Billing SDKs until product + legal decide
- Put subscription gates that lock core nonprofit ops without a clear upgrade path
- Mix donation checkout with SaaS subscription entitlements

## Prerequisite before coding billing

CEO/product written pricing + whether mobile unlocks paid features or only web admin does.
