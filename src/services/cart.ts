import type { CartItem, Language, Product, Store } from "@/types";
import { unitPrice } from "./catalog";
export function sanitizeCart(value: unknown, products: Product[]): CartItem[] {
  if (!Array.isArray(value)) return [];
  const merged = new Map<string, number>();
  for (const item of value) {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    )
      continue;
    const p = products.find((p) => p.id === item.productId);
    if (!p || p.stock < 1) continue;
    merged.set(
      p.id,
      Math.min(p.stock, (merged.get(p.id) ?? 0) + item.quantity),
    );
  }
  return Array.from(merged, ([productId, quantity]) => ({
    productId,
    quantity,
  }));
}
export const cartTotalCents = (items: CartItem[], products: Product[]) =>
  items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.productId);
    return sum + (p ? Math.round(unitPrice(p) * 100) * item.quantity : 0);
  }, 0);
export function whatsappOrder(
  items: CartItem[],
  products: Product[],
  store: Store,
  lang: Language,
): string | null {
  const validItems = items.filter((item) =>
    products.some((product) => product.id === item.productId),
  );
  if (!/^\d{7,15}$/.test(store.whatsapp) || !validItems.length) return null;
  const money = (cents: number) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
      style: "currency",
      currency: store.currency,
      maximumFractionDigits: 0,
    })
      .format(cents / 100)
      .replace("NIS", lang === "ar" ? "شيكل" : "NIS");
  const lines = [
    lang === "en"
      ? `Hello ${store.name.en}, I would like to order:`
      : `مرحباً ${store.name.ar}، أود طلب:`,
  ];
  for (const item of validItems) {
    const p = products.find((p) => p.id === item.productId);
    if (p)
      lines.push(
        `${p.name[lang]} | SKU: ${p.sku} | ${lang === "en" ? "Quantity" : "الكمية"}: ${item.quantity} | ${lang === "en" ? "Unit price" : "سعر الوحدة"}: ${money(Math.round(unitPrice(p) * 100))} | ${lang === "en" ? "Line total" : "المجموع"}: ${money(Math.round(unitPrice(p) * 100) * item.quantity)}`,
      );
  }
  lines.push(
    `${lang === "en" ? "Total" : "الإجمالي"}: ${money(cartTotalCents(validItems, products))}`,
  );
  return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
}
