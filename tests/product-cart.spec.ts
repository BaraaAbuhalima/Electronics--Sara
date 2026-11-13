import { test, expect } from "@playwright/test";
import products from "../data/products.json";
import dictionary from "../data/translations.json";
import store from "../data/store.json";
const product = products.find((p) => p.id === "cpu-lab-kit")!;
for (const language of ["en", "ar"] as const) {
  for (const width of [320, 1366]) {
    test(`${language}: product page cart opens, edits, persists and removes items at ${width}px`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (lang) => localStorage.setItem("volt-language", lang),
        language,
      );
      await page.goto(`/product/${product.id}`);
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      await page.locator(".cart-button").click();
      await expect(page.getByRole("dialog")).toContainText(
        dictionary[language].emptyCart,
      );
      await expect(page).toHaveURL(new RegExp(`/product/${product.id}$`));
      await page.keyboard.press("Escape");
      await page.locator(".detail-purchase .primary").click();
      await expect(page.getByRole("status")).toHaveText(
        dictionary[language].added,
      );
      await expect(page.locator(".cart-count")).toHaveText("1");
      await page.locator(".cart-button").click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(".cart-item-name")).toHaveText(
        product.name[language],
      );
      await expect(page).toHaveURL(new RegExp(`/product/${product.id}$`));
      await dialog
        .getByRole("button", {
          name: dictionary[language].increase,
          exact: true,
        })
        .click();
      const total = new Intl.NumberFormat(
        language === "ar" ? "ar-EG-u-nu-latn" : "en-US",
        {
          style: "currency",
          currency: store.currency,
          maximumFractionDigits: 0,
        },
      )
        .format((product.discountPrice ?? product.price) * 2)
        .replace("NIS", language === "ar" ? "شيكل" : "NIS");
      await expect(dialog.locator(".cart-total")).toContainText(total);
      await expect(page.locator(".cart-count")).toHaveText("2");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("volt-cart") ?? "[]")[0]
                ?.quantity,
          ),
        )
        .toBe(2);
      expect(await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(
        true,
      );
      await page.keyboard.press("Escape");
      await page.reload();
      await expect(page.locator(".cart-count")).toHaveText("2");
      await page.locator(".cart-button").click();
      await dialog
        .getByRole("button", {
          name: dictionary[language].decrease,
          exact: true,
        })
        .click();
      await expect(page.locator(".cart-count")).toHaveText("1");
      await dialog.locator(".remove-item").click();
      await expect(dialog).toContainText(dictionary[language].emptyCart);
      await expect(page.locator(".cart-count")).toHaveText("0");
      await expect
        .poll(() =>
          page.evaluate(
            () => JSON.parse(localStorage.getItem("volt-cart") ?? "[]").length,
          ),
        )
        .toBe(0);
      expect(errors).toEqual([]);
    });
  }
}

test("cart stays consistent between storefront and product pages", async ({
  page,
}) => {
  await page.goto("/");
  const card = page
    .locator(".product-card")
    .filter({
      has: page.getByRole("button", { name: product.name.en, exact: true }),
    });
  await card.locator(".cart-action").click();
  await expect(page.locator(".cart-count")).toHaveText("1");
  await card.locator(".product-name").click();
  await expect(page.locator(".cart-count")).toHaveText("1");
  await page.locator(".cart-button").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: dictionary.en.increase, exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.locator("header .brand").click();
  await expect(page.locator(".cart-count")).toHaveText("2");
  await page.locator(".cart-button").click();
  await expect(page.getByRole("dialog").locator(".cart-item-name")).toHaveText(
    product.name.en,
  );
});
