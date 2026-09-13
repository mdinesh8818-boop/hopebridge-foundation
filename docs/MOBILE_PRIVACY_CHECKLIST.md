# Mobile privacy checklist — HopeBridge

**Not legal advice.** Have counsel review before App Store / Play submission.

## Data categories likely involved

| Category | Examples in HopeBridge | Notes |
|----------|------------------------|-------|
| Account credentials | Email/password via Firebase Auth | Auth provider disclosures |
| User profile | Name, role, organization membership, status | Access-control fields |
| Organization profile | Legal name, contacts, website, mission | Org admins manage |
| Donor records | Names, contact, giving amounts/history | Sensitive fundraising data |
| Volunteer records | Contact, availability, hours | Personnel-adjacent |
| Beneficiary records | Names, support history, locations | Often highly sensitive |
| Teams / assignments | Staffing and workload | Internal ops |
| Analytics aggregates | Campaign/program metrics | Derived from org data |
| AI prompts & completions | User questions + org-scoped context sent to server/OpenAI | Must disclose third-party processing |
| Device diagnostics | Crash logs if added later | Not implemented yet |
| Approximate/precise location | Not required by current product | Do not request until needed |
| Photos / camera | Not required yet | Do not add permissions early |
| Push tokens | Not implemented yet | Disclose when added |

## Principles already enforced in product architecture

- Mobile uses the **same** Firestore Security Rules and organization isolation as web
- Pending/disabled accounts cannot access operational data
- Users cannot self-change `organizationId` / role / status
- `OPENAI_API_KEY` remains server-side (never embedded in the app)

## Store disclosure tasks before launch

1. Draft / publish a Privacy Policy URL covering nonprofit operational data + AI processing
2. Complete Apple Privacy Nutrition Labels
3. Complete Google Play Data Safety form
4. Confirm data retention / deletion pathway (account deletion request process)
5. Confirm subprocessors list (Firebase/Google, Vercel, OpenAI)

## Permissions posture for this phase

Implemented / expected:

- Network access (load app + API + Firebase)

Avoid until product need exists:

- Camera / photos
- Microphone
- Precise location
- Contacts
- Bluetooth
- Background location

## Future billing note

Paid SaaS subscriptions are **out of scope** for this mobile packaging phase. If subscriptions are added later, evaluate Apple/Google IAP obligations separately from nonprofit donation flows.
