#!/usr/bin/env node
/**
 * Idempotent organizationId backfill for HopeBridge Foundation legacy records.
 *
 * Default: DRY RUN (no writes).
 *
 * Usage:
 *   node scripts/migrate-organization-id.mjs
 *   node scripts/migrate-organization-id.mjs --apply
 *   HOPEBRIDGE_MIGRATE_APPLY=1 node scripts/migrate-organization-id.mjs
 *
 * Requires Firebase Admin credentials via GOOGLE_APPLICATION_CREDENTIALS
 * or Application Default Credentials. Does NOT run automatically from Cursor.
 *
 * Safety:
 * - Never deletes documents
 * - Only sets organizationId when missing/empty
 * - Never overwrites an existing non-empty organizationId
 * - Targets organizationId = "hopebridge" only
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const APPLY =
  process.argv.includes("--apply") ||
  process.env.HOPEBRIDGE_MIGRATE_APPLY === "1";

const ORG_ID = "hopebridge";

const COLLECTIONS = [
  "campaigns",
  "programs",
  "donors",
  "donations",
  "volunteers",
  "beneficiaries",
  "beneficiaryActivity",
  "teams",
  "teamMembers",
  "teamAssignments",
  "teamDiscussions",
  "teamMeetings",
  "teamActivity",
  "activities",
  "missionVision",
  "coreValues",
  "strategicGoals",
  "organizationProfile",
];

async function main() {
  let admin;
  try {
    admin = await import("firebase-admin");
  } catch {
    console.error(
      "firebase-admin is not installed. Install it in an operator environment before running this migration.",
    );
    console.error("Dry-run inventory of target collections:");
    for (const name of COLLECTIONS) {
      console.log(` - ${name}`);
    }
    console.log(
      JSON.stringify(
        {
          mode: APPLY ? "apply" : "dry-run",
          organizationId: ORG_ID,
          note: "No writes performed — firebase-admin unavailable in this environment.",
        },
        null,
        2,
      ),
    );
    process.exit(APPLY ? 1 : 0);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const db = admin.firestore();
  const summary = [];

  for (const collectionName of COLLECTIONS) {
    const snap = await db.collection(collectionName).get();
    let tagged = 0;
    let skipped = 0;
    let wouldUpdate = 0;

    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const existing =
        typeof data.organizationId === "string" ? data.organizationId.trim() : "";
      if (existing) {
        skipped += 1;
        continue;
      }
      wouldUpdate += 1;
      if (APPLY) {
        await doc.ref.set(
          { organizationId: ORG_ID, migratedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true },
        );
        tagged += 1;
      }
    }

    summary.push({
      collection: collectionName,
      total: snap.size,
      alreadyScoped: skipped,
      missingOrganizationId: wouldUpdate,
      updated: APPLY ? tagged : 0,
    });
  }

  // Ensure organizations/hopebridge exists
  const orgRef = db.collection("organizations").doc(ORG_ID);
  const orgSnap = await orgRef.get();
  let orgAction = "exists";
  if (!orgSnap.exists) {
    orgAction = APPLY ? "created" : "would-create";
    if (APPLY) {
      await orgRef.set({
        name: "HopeBridge Foundation",
        displayName: "HopeBridge Foundation",
        organizationType: "foundation",
        mission: "",
        website: "",
        primaryContact: "",
        contactEmail: "",
        phone: "",
        country: "United States",
        stateRegion: "",
        logoUrl: "",
        primaryAccent: "emerald",
        createdBy: "system",
        onboardingComplete: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        organizationId: ORG_ID,
        organizationsDoc: orgAction,
        collections: summary,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
