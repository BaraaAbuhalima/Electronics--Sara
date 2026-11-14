import { test, expect } from "@playwright/test";

for (const language of ["en", "ar"] as const) {
  for (const width of [375, 1366]) {
    test(`${language}: back to products returns to the catalog top at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(
        (lang) => localStorage.setItem("volt-language", lang),
        language,
      );
      await page.goto("/#products");
      await expect(page.locator(".catalog")).toBeVisible();
      await page.locator(".product-name").last().scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
      await page.locator(".product-name").last().click();
      await expect(page).toHaveURL(/\/product\//);
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.locator(".product-back-link").click();
      await expect(page).toHaveURL(/\/#products$/);
      await expect(page.locator(".catalog")).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeLessThanOrEqual(1);
      await expect(page.locator(".catalog-header")).toBeInViewport();
      // Repeat with a cached storefront, rather than checking only a cold load.
      await page.locator(".product-name").last().click();
      await expect(page).toHaveURL(/\/product\//);
      await page.locator(".product-back-link").click();
      await expect(page.locator(".catalog")).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeLessThanOrEqual(1);
    });
  }
}
