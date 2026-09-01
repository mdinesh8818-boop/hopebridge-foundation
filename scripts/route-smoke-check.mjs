#!/usr/bin/env node
/**
 * Smoke check: verify dashboard route modules export a default page component file.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

const routes = [
  "/",
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
  if (route === "/") return join(root, "src/app/page.tsx");
  return join(root, "src/app", route.slice(1), "page.tsx");
};

let failed = 0;

for (const route of routes) {
  const file = pageForRoute(route);
  if (!existsSync(file)) {
    console.error(`MISSING page for ${route}: ${file}`);
    failed += 1;
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`Route smoke check passed (${routes.length} routes).`);
