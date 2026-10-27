import { test, expect } from "@playwright/test";

test.describe("LanguageGap Dashboard E2E", () => {
  test("loads the overview page with tagline and action links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LanguageGap/);
    await expect(page.locator("h1")).toContainText("Same question");
    await expect(page.locator("h1")).toContainText("Different languages");
    await expect(page.getByRole("link", { name: "Run an evaluation" })).toBeVisible();
  });

  test("navigates to evaluation setup screen", async ({ page }) => {
    await page.goto("/evaluate");
    await expect(page.locator("h1")).toContainText("Launch Multilingual Evaluation");
    await expect(page.getByText("Mock Provider", { exact: true })).toBeVisible();
    await expect(page.getByText("Gemma 4 Live Server")).toBeVisible();
  });
});
