import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders form controls", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

const e2eEmail = process.env.HOPEBRIDGE_E2E_EMAIL;
const e2ePassword = process.env.HOPEBRIDGE_E2E_PASSWORD;
const hasAuthCreds = Boolean(e2eEmail && e2ePassword);

test.describe("Authenticated workspace", () => {
  test.skip(!hasAuthCreds, "Set HOPEBRIDGE_E2E_EMAIL and HOPEBRIDGE_E2E_PASSWORD for authenticated tests");

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill(e2eEmail!);
    await page.getByLabel(/password/i).fill(e2ePassword!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  });

  test("sidebar navigates to Campaigns and Reports", async ({ page }) => {
    await page.getByRole("button", { name: "Campaigns" }).click();
    await expect(page).toHaveURL(/\/dashboard\/campaigns/);
    await expect(page.getByRole("heading", { name: /Campaign/i })).toBeVisible();

    await page.getByRole("button", { name: "Reports" }).click();
    await expect(page).toHaveURL(/\/dashboard\/reports/);
    await expect(page.getByRole("heading", { name: /Organizational Reports/i })).toBeVisible();
  });

  test("AI Assistant connected data sources link to modules", async ({ page }) => {
    await page.goto("/dashboard/ai-assistant");
    await expect(page.getByRole("heading", { name: /HopeBridge AI/i })).toBeVisible();

    const campaignsChip = page.getByRole("link", { name: "Campaigns" });
    await expect(campaignsChip).toHaveAttribute("href", "/dashboard/campaigns");

    await campaignsChip.click();
    await expect(page).toHaveURL(/\/dashboard\/campaigns/);
  });

  test("campaign create modal opens from quick action", async ({ page }) => {
    await page.goto("/dashboard/campaigns?action=create");
    await expect(page.getByRole("heading", { name: /Create Campaign/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
