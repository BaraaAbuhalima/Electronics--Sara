import productsJSON from "../../data/products.json";
import categoriesJSON from "../../data/categories.json";
import storeJSON from "../../data/store.json";
import { isProduct, isCategory, validateData } from "./validation";
import type { Product, Store } from "@/types";
export const dataErrors = validateData(productsJSON, categoriesJSON, storeJSON);
const products: Product[] = (productsJSON as unknown[])
  .filter(isProduct)
  .filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)
  .map((p) => ({
    ...p,
    images: p.images.filter((i) => typeof i === "string").length
      ? p.images.filter((i) => typeof i === "string")
      : ["/images/fallback.svg"],
    specifications: Array.isArray(p.specifications)
      ? p.specifications.filter(
          (s) => s?.label?.en && s?.label?.ar && s?.value?.en && s?.value?.ar,
        )
      : [],
    components: Array.isArray(p.components)
      ? p.components.filter(
          (c) =>
            c &&
            (typeof c.productId === "string" ||
              (c.name?.en && c.name?.ar)) &&
            Number.isInteger(c.quantity) &&
            c.quantity > 0,
        )
      : [],
  }));
export const getAllProducts = () => products;
export const getProductById = (id: string) => products.find((p) => p.id === id);
export const getProductsByCategory = (id: string) =>
  products.filter((p) => p.categoryId === id);
export const getFeaturedProducts = () => products.filter((p) => p.featured);
export const getAllCategories = () => categoriesJSON.filter(isCategory);
export const getStoreInfo = () => storeJSON as Store;
export const getKitComponents = (id: string) =>
  (getProductById(id)?.components ?? []).map((c) => ({
    ...c,
    product: c.productId ? getProductById(c.productId) : undefined,
  }));
export const unitPrice = (p: Product) =>
  p.discountPrice != null && p.discountPrice >= 0 && p.discountPrice <= p.price
    ? p.discountPrice
    : p.price;
