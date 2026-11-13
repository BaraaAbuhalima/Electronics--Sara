"use client";
import { MessageCircle, Plus } from "lucide-react";
import { unitPrice } from "@/services/catalog";
import type { Product, Language } from "@/types";
import type { Translate } from "@/types/i18n";
import SafeImage from "./SafeImage";
export default function ProductCard({
  product: p,
  lang,
  t,
  money,
  add,
  order,
  openProduct,
}: {
  product: Product;
  lang: Language;
  t: Translate;
  money: (amount: number) => string;
  add: (product: Product) => void;
  order: (product: Product) => void;
  openProduct: (id: string) => void;
}) {
  return (
    <article
      className="product-card"
      role="link"
      tabIndex={0}
      onClick={() => openProduct(p.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProduct(p.id);
        }
      }}
      aria-label={`${t("details")}: ${p.name[lang]}`}
    >
      <div className="product-image-wrap">
        <button
          className="product-image-button"
          onClick={(event) => {
            event.stopPropagation();
            openProduct(p.id);
          }}
          aria-label={`${t("details")}: ${p.name[lang]}`}
        >
          <SafeImage src={p.images[0]} alt={p.name[lang]} loading="lazy" />
        </button>
        {p.discountPrice != null && p.discountPrice < p.price && (
          <span className="discount-badge">
            −{Math.round((1 - p.discountPrice / p.price) * 100)}%
          </span>
        )}
      </div>
      <div className="product-content">
        <button
          className="product-name"
          onClick={(event) => {
            event.stopPropagation();
            openProduct(p.id);
          }}
        >
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
          <span className={`stock ${!p.inStock ? "unavailable" : ""}`}>
            <i />
            {t(p.inStock ? "inStock" : "outStock")}
          </span>
        </div>
        <div className="product-actions">
          <button
            className="product-action order-action"
            onClick={(event) => {
              event.stopPropagation();
              order(p);
            }}
            disabled={!p.inStock}
          >
            <MessageCircle size={15} />
            {t("orderNow")}
          </button>
          <button
            className="product-action cart-action"
            disabled={!p.inStock}
            onClick={(event) => {
              event.stopPropagation();
              add(p);
            }}
          >
            {t("add")}
            <Plus size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
