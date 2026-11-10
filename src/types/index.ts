export type Language = "en" | "ar";
export type Localized = Record<Language, string>;
export type ProductType = "component" | "kit" | "bundle";
export interface Specification {
  label: Localized;
  value: Localized;
}
export interface KitComponent {
  productId?: string;
  name?: Localized;
  image?: string;
  quantity: number;
}
export interface Product {
  id: string;
  type: ProductType;
  name: Localized;
  description: Localized;
  price: number;
  discountPrice?: number | null;
  currency: string;
  sku: string;
  categoryId: string;
  images: string[];
  stock: number;
  specifications?: Specification[];
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  components?: KitComponent[];
}
export interface Category {
  id: string;
  name: Localized;
  description: Localized;
  image: string;
}
export interface Store {
  name: Localized;
  tagline: Localized;
  logo: string;
  description: Localized;
  hero: {
    eyebrow: Localized;
    title: Localized;
    description: Localized;
    productIds: string[];
    kitProductId: string;
  };
  about: Localized;
  whatsapp: string;
  email: string;
  contactNote: Localized;
  socials: { name: string; url: string }[];
  currency: string;
  copyright: Localized;
}
export interface CartItem {
  productId: string;
  quantity: number;
}
