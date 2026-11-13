import { test, expect } from "@playwright/test";
import products from "../data/products.json";
import store from "../data/store.json";

test("home page renders the configured catalog in responsive layouts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    store.hero.title.en.split("\n")[0],
  );
  await expect(page.locator(".product-card")).toHaveCount(products.length);
  await expect(page.locator(".product-name")).toContainText(
    products.map((p) => p.name.en),
  );
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

test("CPU kit details show the configured components and NIS price", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", {
      name: products.find((p) => p.id === "cpu-lab-kit")!.name.en,
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/product\/cpu-lab-kit$/);
  await expect(page.locator(".component-table")).toContainText(
    "13x25cm DIY Prototype PCB Board",
  );
  await expect(page.locator(".component-table")).toContainText(
    "32 Pin Wirewrap IC Socket",
  );
  const components = products.find((p) => p.id === "cpu-lab-kit")!.components!;
  await expect(page.locator(".component-table tbody tr")).toHaveCount(
    components.length,
  );
  await expect(page.locator(".component-image")).toHaveCount(
    components.filter((c) => c.image).length,
  );
  await expect(page.locator(".detail-price")).toContainText("NIS");
  await expect(page.locator(".component-table")).not.toContainText("0.8");
});
