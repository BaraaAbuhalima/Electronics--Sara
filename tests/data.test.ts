import { test } from "node:test";
import assert from "node:assert/strict";
import products from "../data/products.json";
import categories from "../data/categories.json";
import store from "../data/store.json";
import { validateData } from "../src/services/validation";
import { getAllProducts, getKitComponents } from "../src/services/catalog";
import {
  cartTotalCents,
  sanitizeCart,
  whatsappOrder,
} from "../src/services/cart";
import type { Store } from "../src/types";
const all = getAllProducts();
test("all bilingual sample data and references are valid", () => {
  assert.deepEqual(validateData(products, categories, store), []);
  for (const p of all.filter((p) => p.type !== "component"))
    assert.ok(
      getKitComponents(p.id).every((c) => (c.product || c.name) && c.quantity > 0),
    );
  assert.equal(getKitComponents("cpu-lab-kit").length, 21);
});
test("validator catches duplicates, missing fields, categories, types, prices, images and component references", () => {
  const cases = [
    { id: "" },
    { name: { en: "", ar: "" } },
    { price: -1 },
    { discountPrice: 1000 },
    { inStock: "yes" },
    { categoryId: "missing" },
    { type: "unknown" },
    { images: ["/missing.jpg"] },
    { specifications: [{ label: { en: "x" }, value: { en: "x" } }] },
  ];
  for (const patch of cases) {
    const copy = structuredClone(products);
    Object.assign(copy[0], patch);
    assert.ok(validateData(copy, categories).length, JSON.stringify(patch));
  }
  for (const components of [
    [{ productId: "missing", quantity: 1 }],
    [{ productId: "cpu", quantity: 0 }],
    [],
  ]) {
    const copy = structuredClone(products);
    Object.assign(
      copy.find((p) => p.type === "kit")!,
      { components },
    );
    assert.ok(validateData(copy, categories).length);
  }
});
test("cart rejects malformed data, removes missing/out-of-stock products, and merges lines", () => {
  assert.deepEqual(
    sanitizeCart(
      [
        { productId: "cpu-lab-kit", quantity: 500 },
        { productId: "cpu-lab-kit", quantity: 2 },
        { productId: "missing", quantity: 1 },
        { productId: "cpu-lab-kit", quantity: -2 },
      ],
      all,
    ),
    [{ productId: "cpu-lab-kit", quantity: 502 }],
  );
  assert.deepEqual(sanitizeCart(null, all), []);
});
test("cart uses cents with exact quantity totals", () => {
  assert.equal(
    cartTotalCents([{ productId: "cpu-lab-kit", quantity: 3 }], all),
    24000,
  );
});
test("WhatsApp URLs include store phone, SKU, names, unit/line totals and quantities in both languages", () => {
  const configured = { ...store, whatsapp: "15551234567" } as Store;
  for (const lang of ["en", "ar"] as const) {
    const url = whatsappOrder(
      [{ productId: "cpu-lab-kit", quantity: 2 }],
      all,
      configured,
      lang,
    )!;
    assert.ok(url.startsWith("https://wa.me/15551234567?text="));
    const text = new URL(url).searchParams.get("text")!;
    assert.ok(
      text.includes(all.find((p) => p.id === "cpu-lab-kit")!.name[lang]),
    );
    assert.ok(text.includes("VLT-CPU-LAB-KIT"));
    assert.ok(text.includes(lang === "en" ? "Total" : "الإجمالي"));
    assert.ok(text.includes(lang === "en" ? "160.00" : "١٦٠٫٠٠"));
  }
  assert.equal(
    whatsappOrder(
      [{ productId: "missing", quantity: 1 }],
      all,
      { ...store, whatsapp: "" } as Store,
      "en",
    ),
    null,
  );
  assert.equal(whatsappOrder([], all, configured, "en"), null);
});

test("every documented JSON example is valid against the implemented catalog schema", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const guide of ["README.md", "README_AR.md"]) {
    const text = await readFile(guide, "utf8");
    const examples = [...text.matchAll(/```json\n([\s\S]*?)\n```/g)];
    assert.ok(examples.length >= 7);
    for (const example of examples) {
      const data = JSON.parse(example[1]);
      if (!Array.isArray(data) && data.sku) {
        const updated = products.map((p) => (p.id === data.id ? data : p));
        assert.deepEqual(
          validateData(updated, categories, store),
          [],
          `${guide}: ${data.id}`,
        );
      } else if (!Array.isArray(data) && data.image) {
        const updated = categories.map((c) => (c.id === data.id ? data : c));
        assert.deepEqual(validateData(products, updated, store), []);
      } else {
        const updated = structuredClone(products);
        Object.assign(updated[0], { specifications: data });
        assert.deepEqual(validateData(updated, categories, store), []);
      }
    }
  }
});
