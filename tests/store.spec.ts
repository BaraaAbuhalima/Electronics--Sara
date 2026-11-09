import { test, expect } from "@playwright/test";

test("desktop home, images, navigation and responsive layouts in both languages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Great ideas",
  );
  await expect(page.locator(".category-card")).toHaveCount(8);
  await expect(page.locator(".product-card")).toHaveCount(4);
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "الأفكار",
  );
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "فتح القائمة" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "المنتجات", exact: true })
    .click();
  await expect(page.locator(".catalog")).toBeVisible();
  await page.evaluate(async () => {
    document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
    await Promise.all(
      Array.from(document.images).map((i) =>
        i.complete
          ? Promise.resolve()
          : new Promise((r) => {
              i.onload = r;
              i.onerror = r;
            }),
      ),
    );
  });
  const broken = await page
    .locator("img")
    .evaluateAll((imgs) =>
      imgs
        .filter((i) => !(i as HTMLImageElement).naturalWidth)
        .map((i) => (i as HTMLImageElement).src),
    );
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test("catalog search, category/type filters, sorting, empty state, and product details", async ({
  page,
}) => {
  await page.goto("/#products");
  await expect(page.locator(".product-card")).toHaveCount(29);
  await page.locator(".catalog-search input").fill("Arduino");
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .last()
    .click();
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("motors");
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "All product types", exact: true })
    .selectOption("bundle");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("priceLow");
  await expect(page.locator(".product-name").first()).toHaveText(
    "4×AA Battery Holder",
  );
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("priceHigh");
  await expect(page.locator(".product-name").first()).toHaveText(
    "CPU Starter Kit",
  );
  await page
    .getByRole("combobox", { name: "Sort by", exact: true })
    .selectOption("alphabetical");
  const names = await page.locator(".product-name").allTextContents();
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
  await page.locator(".catalog-search input").fill("nothing-matches");
  await expect(page.locator(".empty-results")).toBeVisible();
  await page.locator(".catalog-search input").fill("Arduino Uno");
  await page.locator(".product-name").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("ATmega328P");
  await expect(dialog).toContainText("VLT-ARDUINO-UNO");
  await dialog.getByRole("button", { name: "Increase quantity" }).click();
  await dialog
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Your cart (2)" }).click();
  await expect(page.locator(".cart-total")).toContainText("$43.80");
  await page.keyboard.press("Escape");
  await page.goto("/#product/removed");
  await expect(page.getByRole("dialog")).toContainText("Product unavailable");
});

test("kits resolve all components, cart persists, quantity controls, unavailable stock and Arabic cart", async ({
  page,
}) => {
  await page.goto("/#product/cpu-kit");
  await expect(page.locator(".component-list>div")).toHaveCount(5);
  await expect(page.locator(".component-list")).toContainText(
    "8GB DDR4 Memory",
  );
  await expect(page.locator(".component-list")).toContainText("× 2");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add to cart", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Your cart (1)" }).click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await expect(page.locator(".cart-total")).toContainText("$349.00");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Increase quantity" })
    .click();
  await expect(page.locator(".cart-total")).toContainText("$698.00");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Your cart (2)" }).click();
  await expect(page.locator(".cart-total")).toContainText("$698.00");
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(page.locator(".cart-total")).toContainText("$349.00");
  await page.keyboard.press("Escape");
  await page.goto("/#product/pir");
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Add to cart", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Switch to Arabic" }).click();
  await page.getByRole("button", { name: "سلتك (1)" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "طقم بناء حاسوب للمبتدئين",
  );
  await expect(page.getByRole("dialog")).toContainText(
    "الطلب عبر واتساب غير متاح",
  );
  await page
    .getByRole("button", { name: "إزالة: طقم بناء حاسوب للمبتدئين" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "مشروعك القادم بانتظارك",
  );
});

test("missing images fall back and corrupted storage does not crash the store", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("volt-cart", "not-json"));
  await page.route("**/images/products/uno.jpg", (route) => route.abort());
  await page.goto("/#product/arduino-uno");
  await expect(page.locator(".detail-image img")).toHaveAttribute(
    "src",
    "/images/fallback.svg",
  );
  await expect(
    page.getByRole("heading", { name: "Arduino Uno R3", exact: true }),
  ).toBeVisible();
});
