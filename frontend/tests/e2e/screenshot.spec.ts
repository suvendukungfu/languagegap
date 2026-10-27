import { test } from "@playwright/test";

test.describe("Screenshot Capture", () => {
  test("capture responsive redesign screenshots", async ({ page }) => {
    const viewports = [
      { name: "desktop_1440x1440", width: 1440, height: 1440 },
      { name: "desktop_1440x900", width: 1440, height: 900 },
      { name: "tablet_landscape_1024x768", width: 1024, height: 768 },
      { name: "tablet_portrait_768x1024", width: 768, height: 1024 },
      { name: "mobile_390x844", width: 390, height: 844 },
      { name: "mobile_375x812", width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.screenshot({ path: `../docs/screenshots/redesign/${vp.name}.png`, fullPage: false });
    }

    // Also full page on 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `../docs/screenshots/redesign/desktop_full_page.png`, fullPage: true });

    // Evaluation Detail Desktop
    await page.goto("/evaluations/b65681b9-d657-47ba-8056-5125cd62a8a0");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "../docs/screenshots/redesign/evaluation_detail_redesign.png", fullPage: false });

    // Evaluate Setup Desktop
    await page.goto("/evaluate");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "../docs/screenshots/redesign/evaluate_page_redesign.png", fullPage: false });
  });
});
