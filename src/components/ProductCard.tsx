"use client";
import { Plus, ArrowUpRight } from "lucide-react";
import { getAllCategories, unitPrice } from "@/services/catalog";
import type { Product, Language } from "@/types";
import type { Translate } from "@/types/i18n";
import SafeImage from "./SafeImage";
const categories = getAllCategories();
export default function ProductCard({
  product: p,
  lang,
  t,
  money,
  add,
  openProduct,
}: {
  product: Product;
  lang: Language;
  t: Translate;
  money: (amount: number) => string;
  add: (product: Product) => void;
  openProduct: (id: string) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <button
          className="product-image-button"
          onClick={() => openProduct(p.id)}
          aria-label={`${t("details")}: ${p.name[lang]}`}
        >
          <SafeImage src={p.images[0]} alt={p.name[lang]} loading="lazy" />
        </button>
        <span className={`product-type ${p.type}`}>{t(p.type)}</span>
        {p.discountPrice != null && p.discountPrice < p.price && (
          <span className="discount-badge">
            −{Math.round((1 - p.discountPrice / p.price) * 100)}%
          </span>
        )}
        <button
          className="quick-add"
          disabled={!p.stock}
          onClick={() => add(p)}
          aria-label={`${t("add")}: ${p.name[lang]}`}
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="product-content">
        <div className="product-category">
          {categories.find((c) => c.id === p.categoryId)?.name[lang]}
        </div>
        <button className="product-name" onClick={() => openProduct(p.id)}>
          {p.name[lang]}
        </button>
        <p>{p.description[lang]}</p>
        <div className="product-bottom">
          <div className="price">
            <bdi>{money(unitPrice(p))}</bdi>
            {p.discountPrice != null && (
              <del>
                <bdi>{money(p.price)}</bdi>
              </del>
            )}
          </div>
          <span className={`stock ${!p.stock ? "unavailable" : ""}`}>
            <i />
            {t(p.stock ? "inStock" : "outStock")}
          </span>
        </div>
        <div className="product-actions">
          <button onClick={() => openProduct(p.id)}>
            {t("details")}
            <ArrowUpRight size={15} />
          </button>
          <button disabled={!p.stock} onClick={() => add(p)}>
            {t("add")}
            <Plus size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
