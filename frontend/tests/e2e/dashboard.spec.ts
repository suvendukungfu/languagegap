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

  test("dispatches an evaluation cohort (24 responses) and inspects the comparison matrix", async ({ page }) => {
    await page.goto("/evaluate");
    await page.waitForLoadState("networkidle");

    // Verify 24 responses indicated on the button
    const dispatchBtn = page.getByRole("button", { name: /Dispatch Evaluation Cohort \(24 Responses\)/i });
    await expect(dispatchBtn).toBeVisible();

    // Dispatch the cohort run
    await dispatchBtn.click();

    // Verify live progress banner
    await expect(page.getByText(/Cohort Run:/i)).toBeVisible();

    // Wait for the completion link
    const matrixLink = page.getByRole("link", { name: /View Comparison Matrix/i });
    await expect(matrixLink).toBeVisible({ timeout: 15000 });

    // Navigate to evaluation detail page
    await matrixLink.click();
    await page.waitForLoadState("networkidle");

    // Verify evaluation detail page elements
    await expect(page.getByRole("heading", { name: "Cross-Lingual Evaluation Matrix" })).toBeVisible();
    await expect(page.getByText(/Reproducibility Passport/i)).toBeVisible();
    await expect(page.getByText(/Benchmark Integrity & Audit Passport/i)).toBeVisible();
  });
});
