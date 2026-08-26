# Firestore security rules

Versioned rules for HopeBridge live in [`firestore.rules`](./firestore.rules).

## Deploy

```bash
firebase deploy --only firestore:rules
```

Deploy **after** shipping the client that:

1. Creates `users/{uid}` profiles with `organizationId` + `role`
2. Soft-tags legacy documents with `organizationId: "hopebridge-foundation"`

Until rules are deployed, the client still enforces organization scoping in
`src/services/firestore.ts`. Rules provide server-side enforcement.

## Notes

- No private service-account keys are required in the Next.js client.
- Session cookies store verified Firebase ID tokens (httpOnly) via `/api/auth/session`.
- Default organization id for legacy data: `hopebridge-foundation`.
