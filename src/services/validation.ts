import type { Category, Product, Store } from "@/types";
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const localized = (v: unknown) =>
  object(v) &&
  ["en", "ar"].every(
    (l) => typeof v[l] === "string" && (v[l] as string).trim().length > 0,
  );
const price = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
const image = (v: unknown) =>
  typeof v === "string" &&
  /^\/images\/[\w/.-]+\.(svg|png|jpe?g|webp|avif)$/i.test(v) &&
  !v.includes("..");
export function validateData(
  products: unknown,
  categories: unknown,
  store?: unknown,
): string[] {
  const errors: string[] = [];
  if (!Array.isArray(products) || !Array.isArray(categories))
    return ["Products and categories must be JSON arrays."];
  const ids = new Set<string>(),
    catIds = new Set<string>();
  categories.forEach((c, n) => {
    if (
      !object(c) ||
      typeof c.id !== "string" ||
      !c.id ||
      !localized(c.name) ||
      !localized(c.description) ||
      !image(c.image)
    )
      errors.push(
        `Category ${n}: missing or invalid id, translations, or image.`,
      );
    else {
      if (catIds.has(c.id)) errors.push(`Duplicate category ID: ${c.id}`);
      catIds.add(c.id);
    }
  });
  products.forEach((p, n) => {
    if (!object(p)) {
      errors.push(`Product ${n}: expected an object.`);
      return;
    }
    const id = typeof p.id === "string" ? p.id : `row ${n}`;
    if (typeof p.id !== "string" || !p.id.trim())
      errors.push(`Product ${n}: missing id.`);
    if (ids.has(id)) errors.push(`Duplicate product ID: ${id}`);
    ids.add(id);
    if (!["component", "kit", "bundle"].includes(p.type as string))
      errors.push(`${id}: invalid type.`);
    if (!localized(p.name) || !localized(p.description))
      errors.push(`${id}: name and description require English and Arabic.`);
    if (!price(p.price)) errors.push(`${id}: invalid price.`);
    if (
      p.discountPrice != null &&
      (!price(p.discountPrice) ||
        (p.discountPrice as number) > (p.price as number))
    )
      errors.push(`${id}: invalid discount price.`);
    if (typeof p.currency !== "string" || !/^[A-Z]{3}$/.test(p.currency))
      errors.push(`${id}: invalid currency.`);
    if (typeof p.sku !== "string" || !p.sku.trim())
      errors.push(`${id}: missing SKU.`);
    if (!catIds.has(p.categoryId as string))
      errors.push(`${id}: invalid category reference.`);
    if (!Number.isInteger(p.stock) || (p.stock as number) < 0)
      errors.push(`${id}: stock must be a nonnegative integer.`);
    if (!Array.isArray(p.images) || !p.images.length || !p.images.every(image))
      errors.push(`${id}: invalid image paths.`);
    if (
      p.specifications !== undefined &&
      (!Array.isArray(p.specifications) ||
        !p.specifications.every(
          (s) => object(s) && localized(s.label) && localized(s.value),
        ))
    )
      errors.push(`${id}: invalid specifications.`);
    for (const flag of ["featured", "newArrival", "bestSeller"])
      if (p[flag] !== undefined && typeof p[flag] !== "boolean")
        errors.push(`${id}: ${flag} must be boolean.`);
    if (
      ["kit", "bundle"].includes(p.type as string) &&
      (!Array.isArray(p.components) || !p.components.length)
    )
      errors.push(`${id}: components are required.`);
  });
  products.forEach((p) => {
    if (!object(p)) return;
    if (p.components !== undefined && !Array.isArray(p.components))
      errors.push(`${p.id}: invalid components.`);
    if (Array.isArray(p.components))
      p.components.forEach((c) => {
        if (
          !object(c) ||
          !ids.has(c.productId as string) ||
          c.productId === p.id
        )
          errors.push(`${p.id}: missing or invalid component reference.`);
        else if (!Number.isInteger(c.quantity) || (c.quantity as number) < 1)
          errors.push(`${p.id}: invalid component quantity.`);
        else if (
          products.find((x) => object(x) && x.id === c.productId)?.type !==
          "component"
        )
          errors.push(`${p.id}: reference individual components only.`);
      });
  });
  if (store !== undefined) {
    if (!object(store)) errors.push("Store must be an object.");
    else {
      for (const key of [
        "name",
        "tagline",
        "description",
        "about",
        "copyright",
        "contactNote",
      ])
        if (!localized(store[key]))
          errors.push(`Store: invalid ${key} translations.`);
      if (!image(store.logo)) errors.push("Store: invalid logo.");
      if (
        !object(store.hero) ||
        !["eyebrow", "title", "description"].every((k) =>
          localized((store.hero as Record<string, unknown>)[k]),
        )
      )
        errors.push("Store: invalid hero.");
      if (
        typeof store.currency !== "string" ||
        !/^[A-Z]{3}$/.test(store.currency)
      )
        errors.push("Store: invalid currency.");
      if (
        typeof store.whatsapp !== "string" ||
        (store.whatsapp !== "" && !/^\d{7,15}$/.test(store.whatsapp))
      )
        errors.push(
          "Store: WhatsApp must be empty or 7–15 international digits.",
        );
      if (
        typeof store.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.email)
      )
        errors.push("Store: invalid email.");
      if (
        !Array.isArray(store.socials) ||
        !store.socials.every(
          (s) =>
            object(s) &&
            typeof s.name === "string" &&
            typeof s.url === "string" &&
            /^https:\/\//.test(s.url),
        )
      )
        errors.push("Store: socials require a name and HTTPS URL.");
      if (products.some((p) => object(p) && p.currency !== store.currency))
        errors.push("All products must use the store currency.");
    }
  }
  return errors;
}
export function isProduct(value: unknown): value is Product {
  return (
    object(value) &&
    typeof value.id === "string" &&
    localized(value.name) &&
    localized(value.description) &&
    ["component", "kit", "bundle"].includes(value.type as string) &&
    typeof value.sku === "string" &&
    typeof value.currency === "string" &&
    /^[A-Z]{3}$/.test(value.currency) &&
    price(value.price) &&
    Array.isArray(value.images) &&
    Number.isInteger(value.stock) &&
    (value.stock as number) >= 0
  );
}
export function isCategory(value: unknown): value is Category {
  return (
    object(value) &&
    typeof value.id === "string" &&
    localized(value.name) &&
    localized(value.description) &&
    image(value.image)
  );
}
export type { Store };
