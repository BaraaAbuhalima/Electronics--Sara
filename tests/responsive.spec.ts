import { test, expect, type Page, type Locator } from "@playwright/test";

const widths = [320, 375, 768, 1024, 1366, 1920];
// Real catalog photos with three different intrinsic aspect ratios.
const samples = [
  { id: "stepper-motor-tb6600-upgrade-version", shape: "portrait" },
  {
    id: "37mm-dc-gear-motor-12vdc-100rpm-all-steel-gear-6",
    shape: "landscape",
  },
  { id: "5vdc-1-channel-relay-module-active-low", shape: "square" },
  { id: "cpu-lab-kit", shape: "kit" },
];

async function noPageOverflow(page: Page) {
  const size = await page.evaluate(() => ({
    viewport: innerWidth,
    scroll: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    overflow: getComputedStyle(document.documentElement).overflowX,
  }));
  expect(size.scroll).toBeLessThanOrEqual(size.viewport);
  expect(size.body).toBeLessThanOrEqual(size.viewport);
  expect(size.overflow).not.toBe("hidden");
}

async function insideViewport(locator: Locator, width: number) {
  for (const element of await locator.all()) {
    if (!(await element.isVisible())) continue;
    const box = await element.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(-1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
  }
}

async function containedImage(frame: Locator) {
  const image = frame.locator("img").first();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);
  const result = await image.evaluate((i: HTMLImageElement) => {
    const box = i.getBoundingClientRect(),
      frame = i.parentElement!.getBoundingClientRect();
    const css = getComputedStyle(i);
    return {
      left: box.left - frame.left,
      right: frame.right - box.right,
      top: box.top - frame.top,
      bottom: frame.bottom - box.bottom,
      fit: css.objectFit,
      position: css.objectPosition,
      width: box.width,
      height: box.height,
      naturalWidth: i.naturalWidth,
      naturalHeight: i.naturalHeight,
    };
  });
  expect(result.fit).toBe("contain");
  expect(result.position).toBe("50% 50%");
  expect(result.left).toBeGreaterThanOrEqual(-1);
  expect(result.right).toBeGreaterThanOrEqual(-1);
  expect(result.top).toBeGreaterThanOrEqual(-1);
  expect(result.bottom).toBeGreaterThanOrEqual(-1);
  expect(Math.abs(result.left - result.right)).toBeLessThanOrEqual(2);
  expect(Math.abs(result.top - result.bottom)).toBeLessThanOrEqual(2);
  expect(result.width).toBeGreaterThan(80);
  expect(result.height).toBeGreaterThan(60);
  return result;
}

for (const language of ["en", "ar"] as const) {
  for (const width of widths) {
    test(`${language}: storefront, product images, galleries and cart at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (lang) => localStorage.setItem("volt-language", lang),
        language,
      );
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        language === "ar" ? "rtl" : "ltr",
      );
      await noPageOverflow(page);
      await insideViewport(
        page.locator(".site-header, .hero-copy, .product-card, footer"),
        width,
      );
      if (width <= 560) {
        await page.locator(".mobile-toggle").click();
        await insideViewport(page.locator(".navigation"), width);
        await page.locator(".mobile-toggle").click();
      }
      await page.goto("/#products");
      await expect(page.locator(".catalog")).toBeVisible();
      await noPageOverflow(page);
      await insideViewport(
        page.locator(".product-card, .product-image-wrap, .product-actions"),
        width,
      );
      await containedImage(page.locator(".product-image-button").first());
      await page.locator(".cart-action").first().click();
      await page.locator(".cart-button").click();
      await insideViewport(page.getByRole("dialog"), width);
      await expect
        .poll(() =>
          page
            .getByRole("dialog")
            .evaluate((e) => e.scrollWidth <= e.clientWidth),
        )
        .toBe(true);
      await page.keyboard.press("Escape");
      for (const sample of samples) {
        await page.goto(`/product/${sample.id}`);
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          language === "ar" ? "rtl" : "ltr",
        );
        await noPageOverflow(page);
        await insideViewport(
          page.locator(
            ".detail-top, .detail-gallery, .detail-copy, .detail-purchase, .component-table-wrap",
          ),
          width,
        );
        const image = await containedImage(page.locator(".detail-image"));
        if (sample.shape === "portrait")
          expect(image.naturalHeight).toBeGreaterThan(image.naturalWidth);
        if (sample.shape === "landscape")
          expect(image.naturalWidth).toBeGreaterThan(image.naturalHeight);
        if (sample.shape === "square")
          expect(image.naturalWidth).toBe(image.naturalHeight);
        await page.locator(".detail-image").click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await insideViewport(dialog, width);
        await expect
          .poll(() => dialog.evaluate((e) => e.scrollWidth <= e.clientWidth))
          .toBe(true);
        await containedImage(dialog.locator(".gallery-main"));
        await page.keyboard.press("Escape");
      }
    });
  }
}

test("product page language switch updates direction and persists across navigation", async ({
  page,
}) => {
  await page.goto("/product/cpu-lab-kit");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.locator(".language-switch").click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator(".language-switch").click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

for (const language of ["en", "ar"] as const) {
  test(`${language}: multiple-image gallery controls and thumbnails remain contained`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.addInitScript(
      (lang) => localStorage.setItem("volt-language", lang),
      language,
    );
    await page.goto("/product/usb-to-ttl-converter-ftdi-cp2102");
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      language === "ar" ? "rtl" : "ltr",
    );
    const thumbnails = page.locator(".thumbnails button");
    await expect(thumbnails).toHaveCount(3);
    await insideViewport(thumbnails, 320);
    const firstSource = await page
      .locator(".detail-image img")
      .getAttribute("src");
    await page.locator(".detail-gallery-next").click();
    await expect(page.locator(".detail-image img")).not.toHaveAttribute(
      "src",
      firstSource!,
    );
    await page.locator(".detail-image").click();
    await page.locator(".gallery-next").click();
    await containedImage(page.locator(".gallery-main"));
    const source = await page.locator(".gallery-main img").getAttribute("src");
    await page.locator(".gallery-thumbnails button").first().click();
    await expect(page.locator(".gallery-main img")).toHaveAttribute(
      "src",
      firstSource!,
    );
    expect(source).not.toBe(firstSource);
    await insideViewport(
      page.locator(".gallery-nav, .gallery-thumbnails button"),
      320,
    );
    await page.keyboard.press("Escape");
    await noPageOverflow(page);
    await containedImage(page.locator(".detail-image"));
  });
}

for (const language of ["en", "ar"] as const) {
  test(`${language}: product detail popup and nested image viewer fit and close independently`, async ({
    page,
  }) => {
    await page.addInitScript(
      (lang) => localStorage.setItem("volt-language", lang),
      language,
    );
    for (const width of [320, 768, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/#product/cpu-lab-kit");
      const productDialog = page.getByRole("dialog").first();
      await expect(productDialog).toBeVisible();
      await insideViewport(productDialog, width);
      await expect
        .poll(() =>
          productDialog.evaluate((e) => e.scrollWidth <= e.clientWidth),
        )
        .toBe(true);
      await containedImage(page.locator(".detail-image"));
      await page.locator(".detail-image").click();
      await expect(page.getByRole("dialog")).toHaveCount(2);
      await insideViewport(page.getByRole("dialog"), width);
      await containedImage(page.locator(".gallery-main"));
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(1);
      await expect(productDialog).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await noPageOverflow(page);
    }
  });
}
