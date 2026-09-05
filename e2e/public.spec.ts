import { test, expect } from "@playwright/test";

test.describe("Public website", () => {
  test("landing page loads with working section navigation", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Technology for good/i })).toBeVisible();

    const productLink = page.getByRole("link", { name: "Product", exact: true });
    await expect(productLink).toHaveAttribute("href", "#product");

    await page.getByRole("link", { name: "Sign In", exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("signup page is reachable from Get Started", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Get Started" }).first().click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByText(/Create your nonprofit workspace account/i)).toBeVisible();
  });
});
