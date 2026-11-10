"use client";
import { useState } from "react";
import { MessageCircle, ShoppingBag } from "lucide-react";
import {
  getAllCategories,
  getKitComponents,
  unitPrice,
} from "@/services/catalog";
import type { Language, Product } from "@/types";
import type { Translate } from "@/types/i18n";
import SafeImage from "./SafeImage";
import Quantity from "./Quantity";
const categories = getAllCategories();

export default function ProductDetail({
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
  money: (n: number) => string;
  add: (p: Product, n: number) => void;
  order: (p: Product, n: number) => void;
  openProduct: (id: string) => void;
}) {
  const [quantity, setQuantity] = useState(1),
    [image, setImage] = useState(0);
  const category = categories.find((c) => c.id === p.categoryId);
  return (
    <div className="detail">
      <div className="detail-top">
        <div className="detail-gallery">
          <div className="detail-image">
            <SafeImage src={p.images[image]} alt={p.name[lang]} />
          </div>
          {p.images.length > 1 && (
            <div className="thumbnails">
              {p.images.map((src, i) => (
                <button
                  className={i === image ? "active" : ""}
                  key={src}
                  onClick={() => setImage(i)}
                  aria-label={`${t("thumbnail")} ${i + 1}`}
                >
                  <SafeImage src={src} alt={p.name[lang]} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-copy">
          <h2>{p.name[lang]}</h2>
          <p>{p.description[lang]}</p>
          <div className="price detail-price">
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
          <dl className="detail-meta">
            <div>
              <dt>{t("sku")}</dt>
              <dd>
                <bdi>{p.sku}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t("category")}</dt>
              <dd>{category?.name[lang] ?? "—"}</dd>
            </div>
          </dl>
          <label className="quantity-label">{t("quantity")}</label>
          <div className="detail-purchase">
            <Quantity
              value={quantity}
              max={p.stock}
              onChange={setQuantity}
              t={t}
            />
            <button
              className="button secondary"
              disabled={!p.stock}
              onClick={() => order(p, quantity)}
            >
              <MessageCircle size={18} />
              {t("orderNow")}
            </button>
            <button
              className="button primary"
              disabled={!p.stock}
              onClick={() => add(p, quantity)}
            >
              <ShoppingBag size={18} />
              {t("add")}
            </button>
          </div>
        </div>
      </div>
      {p.specifications?.length ? (
        <section className="detail-section">
          <h3>{t("specifications")}</h3>
          <dl className="spec-grid">
            {p.specifications.map((s, i) => (
              <div key={i}>
                <dt>{s.label[lang]}</dt>
                <dd>
                  <bdi>{s.value[lang]}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {p.type !== "component" && (
        <section className="detail-section">
          <div className="section-heading">
            <h3>{t("completeList")}</h3>
            <span>
              {p.components?.reduce((n, c) => n + c.quantity, 0)} {t("items")}
            </span>
          </div>
          <div className="component-table-wrap">
            <table className="component-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">{t("component")}</th>
                  <th scope="col">{t("quantity")}</th>
                </tr>
              </thead>
              <tbody>
                {getKitComponents(p.id).map((c, i) => (
                  <tr key={`${c.productId ?? c.name?.en}-${i}`}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="component-name">
                        {c.image && (
                          <SafeImage
                            src={c.image}
                            alt=""
                            className="component-image"
                            loading="lazy"
                          />
                        )}
                        <span>
                          {c.product?.name[lang] ??
                            c.name?.[lang] ??
                            t("missingComponent")}
                        </span>
                      </div>
                    </td>
                    <td>
                      <bdi>× {c.quantity}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
