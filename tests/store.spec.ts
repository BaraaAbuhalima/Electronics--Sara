import { test, expect } from "@playwright/test";

test("home page shows only the CPU Lab Kit in responsive layouts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Build your own",
  );
  await expect(page.locator(".category-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-name")).toHaveText("CPU Lab Kit");
  await expect(page.locator(".price").first()).toContainText("NIS");
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("CPU Lab Kit details show workbook contents and NIS cart total", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".product-name").click();
  await expect(page).toHaveURL(/\/product\/cpu-lab-kit$/);
  await expect(page.locator(".component-table")).toContainText(
    "13x25cm DIY Prototype PCB Board",
  );
  await expect(page.locator(".component-table")).toContainText(
    "32 Pin Wirewrap IC Socket",
  );
  await expect(page.locator(".component-table tbody tr")).toHaveCount(17);
  await expect(page.locator(".component-image")).toHaveCount(17);
  await expect(page.locator(".detail-price")).toContainText("NIS");
  await expect(page.locator(".component-table")).not.toContainText("0.8");
});
