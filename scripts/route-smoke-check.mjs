#!/usr/bin/env node
/**
 * Smoke check: verify route modules export a default page component file.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const routes = [
  "/",
  "/mission",
  "/what-we-do",
  "/programs",
  "/impact",
  "/stories",
  "/get-involved",
  "/get-involved/volunteer",
  "/get-involved/fundraise",
  "/get-involved/partner",
  "/get-involved/events",
  "/donate",
  "/resources",
  "/about",
  "/about/leadership",
  "/about/organization",
  "/contact",
  "/privacy",
  "/terms",
  "/accessibility",
  "/platform",
  "/auth/login",
  "/auth/signup",
  "/dashboard",
  "/dashboard/mission-vision",
  "/dashboard/campaigns",
  "/dashboard/programs",
  "/dashboard/donors",
  "/dashboard/volunteers",
  "/dashboard/beneficiaries",
  "/dashboard/teams",
  "/dashboard/analytics",
  "/dashboard/ai-assistant",
  "/dashboard/reports",
  "/dashboard/calendar",
  "/dashboard/activity",
  "/dashboard/organization",
  "/dashboard/settings",
  "/dashboard/help",
];

const root = process.cwd();

const pageForRoute = (route) => {
  if (route === "/") {
    return [
      join(root, "src/app/page.tsx"),
      join(root, "src/app/(site)/page.tsx"),
    ];
  }

  const relative = route.slice(1);
  return [
    join(root, "src/app", relative, "page.tsx"),
    join(root, "src/app/(site)", relative, "page.tsx"),
  ];
};

let failed = 0;

for (const route of routes) {
  const candidates = pageForRoute(route);
  if (!candidates.some((file) => existsSync(file))) {
    console.error(`MISSING page for ${route}: tried ${candidates.join(" | ")}`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`Route smoke check passed (${routes.length} routes).`);
