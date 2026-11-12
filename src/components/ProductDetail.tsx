"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingBag } from "lucide-react";
import {
  getAllCategories,
  getKitComponents,
  unitPrice,
} from "@/services/catalog";
import type { Language, Product } from "@/types";
import type { Translate } from "@/types/i18n";
import SafeImage from "./SafeImage";
import Quantity from "./Quantity";
import Modal from "./Modal";
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
  add: (p: Product, n: number, optionId?: string) => void;
  order: (p: Product, n: number, optionId?: string) => void;
  openProduct: (id: string) => void;
}) {
  const [quantity, setQuantity] = useState(1),
    [image, setImage] = useState(0),
    [galleryOpen, setGalleryOpen] = useState(false),
    [galleryImage, setGalleryImage] = useState(0),
    [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
      {},
    );
  const category = categories.find((c) => c.id === p.categoryId);
  const selectedOption = p.optionGroups?.[0]
    ? p.optionGroups[0].options.find(
        (option) => option.id === selectedOptions[p.optionGroups![0].id],
      ) ?? p.optionGroups[0].options[0]
    : undefined;
  const availableStock = selectedOption?.stock ?? p.stock;
  const selectedPrice = selectedOption?.price ?? unitPrice(p);
  const selectedImage = selectedOption?.image ?? p.images[image];
  const galleryImages = Array.from(
    new Set([
      ...p.images,
      ...(p.optionGroups?.flatMap((group) =>
        group.options.map((option) => option.image),
      ) ?? []),
    ]),
  );
  const currentImage = galleryImages[galleryImage] ?? selectedImage;
  const showGallery = (src: string) => {
    setGalleryImage(Math.max(0, galleryImages.indexOf(src)));
    setGalleryOpen(true);
  };
  const moveGallery = (direction: -1 | 1) =>
    setGalleryImage(
      (current) =>
        (current + direction + galleryImages.length) % galleryImages.length,
    );
  return (
    <div className="detail">
      <div className="detail-top">
        <div className="detail-gallery">
          <div className="detail-image-wrap">
            <button
              className="detail-image"
              onClick={() => showGallery(currentImage)}
              aria-label={t("thumbnail")}
            >
              <SafeImage src={currentImage} alt={p.name[lang]} />
            </button>
            {galleryImages.length > 1 && (
              <>
                <button
                  className="detail-gallery-nav detail-gallery-prev"
                  onClick={() => {
                    moveGallery(-1);
                  }}
                  aria-label={t("thumbnail")}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="detail-gallery-nav detail-gallery-next"
                  onClick={() => {
                    moveGallery(1);
                  }}
                  aria-label={t("thumbnail")}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
          {p.images.length > 1 && (
            <div className="thumbnails">
              {p.images.map((src, i) => (
                <button
                  className={i === image ? "active" : ""}
                  key={src}
                  onClick={() => {
                    setImage(i);
                    setGalleryImage(galleryImages.indexOf(src));
                  }}
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
            <bdi>{money(selectedPrice)}</bdi>
            {!selectedOption && p.discountPrice != null && (
              <del>
                <bdi>{money(p.price)}</bdi>
              </del>
            )}
          </div>
          <span className={`stock ${!availableStock ? "unavailable" : ""}`}>
            <i />
            {t(availableStock ? "inStock" : "outStock")}
          </span>
          <dl className="detail-meta">
            <div>
              <dt>{t("sku")}</dt>
              <dd>
                <bdi>{selectedOption?.sku ?? p.sku}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t("category")}</dt>
              <dd>{category?.name[lang] ?? "—"}</dd>
            </div>
          </dl>
          {p.optionGroups?.map((group) => (
            <div className="product-options" key={group.id}>
              <label htmlFor={`option-${group.id}`}>{group.label[lang]}</label>
              <select
                id={`option-${group.id}`}
                value={selectedOptions[group.id] ?? group.options[0]?.id}
                onChange={(event) => {
                  setSelectedOptions((current) => ({
                    ...current,
                    [group.id]: event.target.value,
                  }));
                  setImage(0);
                  const optionImage = group.options.find(
                    (option) => option.id === event.target.value,
                  )?.image;
                  if (optionImage) setGalleryImage(galleryImages.indexOf(optionImage));
                }}
              >
                {group.options.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    disabled={!option.stock}
                  >
                    {option.label[lang]} — {money(option.price)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <label className="quantity-label">{t("quantity")}</label>
          <div className="detail-purchase">
            <Quantity
              value={quantity}
              max={availableStock}
              onChange={setQuantity}
              t={t}
            />
            <button
              className="button secondary"
              disabled={!availableStock}
              onClick={() => order(p, quantity, selectedOption?.id)}
            >
              <MessageCircle size={18} />
              {t("orderNow")}
            </button>
            <button
              className="button primary"
              disabled={!availableStock}
              onClick={() => add(p, quantity, selectedOption?.id)}
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
      {galleryOpen && (
        <Modal
          title={p.name[lang]}
          closeLabel={t("close")}
          onClose={() => setGalleryOpen(false)}
        >
          <div className="gallery-viewer">
            <div className="gallery-main">
              {galleryImages.length > 1 && (
                <button
                  className="gallery-nav gallery-prev"
                  onClick={() => moveGallery(-1)}
                  aria-label={t("thumbnail")}
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <SafeImage
                src={galleryImages[galleryImage]}
                alt={`${p.name[lang]} ${galleryImage + 1}`}
              />
              {galleryImages.length > 1 && (
                <button
                  className="gallery-nav gallery-next"
                  onClick={() => moveGallery(1)}
                  aria-label={t("thumbnail")}
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>
            <div className="gallery-thumbnails">
              {galleryImages.map((src, index) => (
                <button
                  className={index === galleryImage ? "active" : ""}
                  key={src}
                  onClick={() => setGalleryImage(index)}
                  aria-label={`${t("thumbnail")} ${index + 1}`}
                >
                  <SafeImage src={src} alt="" />
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
