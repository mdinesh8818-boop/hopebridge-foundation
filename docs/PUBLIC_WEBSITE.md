# HopeBridge public website

The public nonprofit experience lives under `src/app/(site)/` and reuses HopeBridge emerald / gold / ivory identity tokens from `hopebridge.css` plus `public-site.css`.

## Journey

Public website → Learn / Programs / Impact / Stories → Donate / Volunteer / Get Involved → Sign In → existing `/dashboard` workspace.

The SaaS product marketing page is preserved at `/platform`.

## Content boundary

Public pages use `src/data/public-content.ts` sample/demo content. They do **not** read private Firestore collections (donors, beneficiaries, volunteers PII, reports, AI context, admin data).

When connecting live public content later, prefer sanitized public documents or server aggregations — do not weaken authenticated collection rules for broad client list access.

## Forms

- Donation form: charitable intent only; no card collection; provider-ready messaging
- Volunteer interest: structured for future Volunteers module sync
- Contact / partner / fundraise inquiries: local demo persistence until inbox/CRM webhook exists
- Newsletter: local interest store until email provider exists

Charitable donations and HopeBridge SaaS subscription billing remain separate payment concepts.
