import { test, expect } from "@playwright/test";

test.describe("LanguageGap Dashboard E2E", () => {
  test("loads the overview page with tagline and action links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LanguageGap/);
    await expect(page.locator("h1")).toContainText("Same question. Different languages.");
    await expect(page.getByRole("link", { name: "Start New Evaluation" })).toBeVisible();
  });

  test("navigates to evaluation setup screen", async ({ page }) => {
    await page.goto("/evaluate");
    await expect(page.locator("h1")).toContainText("New Multilingual Evaluation Run");
    await expect(page.getByText("Mock Provider")).toBeVisible();
    await expect(page.getByText("Gemma 4 Live Server")).toBeVisible();
  });
});
