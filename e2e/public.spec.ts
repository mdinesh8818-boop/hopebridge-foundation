import { test, expect } from "@playwright/test";

test.describe("Public website", () => {
  test("nonprofit homepage loads with working primary actions", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /Building bridges of hope in every community/i }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Donate", exact: true }).first()).toHaveAttribute(
      "href",
      "/donate",
    );

    await page.getByRole("link", { name: "Sign In", exact: true }).first().click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: "HopeBridge" }).first()).toBeVisible();
  });

  test("public navigation reaches mission and programs", async ({ page }) => {
    await page.goto("/mission");
    await expect(page.getByRole("heading", { name: /Dignity, opportunity/i })).toBeVisible();

    await page.goto("/programs");
    await expect(page.getByRole("heading", { name: /Causes with clarity/i })).toBeVisible();

    await page.goto("/donate");
    await expect(page.getByRole("heading", { name: /Your gift fuels community programs/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /payment provider pending/i })).toBeVisible();
  });

  test("signup page is reachable from platform get started", async ({ page }) => {
    await page.goto("/platform");
    const getStarted = page.getByRole("link", { name: "Get Started" }).first();
    await expect(getStarted).toHaveAttribute("href", "/auth/signup");
    await getStarted.click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByRole("heading", { name: /Create account/i })).toBeVisible({
      timeout: 20000,
    });
  });
});
