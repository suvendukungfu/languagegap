import { test } from "@playwright/test";

test.describe("Screenshot Capture", () => {
  test("capture responsive redesign screenshots", async ({ page }) => {
    // Desktop Home
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "../docs/screenshots/redesign/desktop_home_redesign.png", fullPage: false });

    // Mobile Home (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "../docs/screenshots/redesign/mobile_home_redesign.png", fullPage: false });

    // Evaluation Detail Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/evaluations/b65681b9-d657-47ba-8056-5125cd62a8a0");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "../docs/screenshots/redesign/evaluation_detail_redesign.png", fullPage: false });

    // Evaluate Setup Desktop
    await page.goto("/evaluate");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "../docs/screenshots/redesign/evaluate_page_redesign.png", fullPage: false });
  });
});
