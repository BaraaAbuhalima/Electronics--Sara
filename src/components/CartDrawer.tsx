"use client";
import type { Dispatch, SetStateAction } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  MessageCircle,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import {
  getAllProducts,
  getProductById,
  getStoreInfo,
  unitPrice,
} from "@/services/catalog";
import { cartTotalCents, whatsappOrder } from "@/services/cart";
import type { CartItem, Language } from "@/types";
import type { Translate } from "@/types/i18n";
import Modal from "./Modal";
import SafeImage from "./SafeImage";
import Quantity from "./Quantity";
const allProducts = getAllProducts(),
  store = getStoreInfo();
export default function CartDrawer({
  cart,
  setCart,
  lang,
  t,
  money,
  onClose,
  onExplore,
  onOpenProduct,
}: {
  cart: CartItem[];
  setCart: Dispatch<SetStateAction<CartItem[]>>;
  lang: Language;
  t: Translate;
  money: (amount: number) => string;
  onClose: () => void;
  onExplore: () => void;
  onOpenProduct: (id: string) => void;
}) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0),
    total = cartTotalCents(cart, allProducts) / 100;
  return (
    <Modal drawer title={t("cart")} closeLabel={t("close")} onClose={onClose}>
      <div className="cart-heading">
        <div className="eyebrow">{store.name[lang]}</div>
        <h2>
          {t("cart")} <span>({count})</span>
        </h2>
      </div>
      {cart.length ? (
        <>
          <div className="cart-items">
            {cart.map((item) => {
              const p = getProductById(item.productId)!;
              const option = p.optionGroups
                ?.flatMap((group) => group.options)
                .find((candidate) => candidate.id === item.optionId);
              return (
                <div
                  className="cart-item"
                  key={`${p.id}-${item.optionId ?? ""}`}
                >
                  <SafeImage
                    src={option?.image ?? p.images[0]}
                    alt={p.name[lang]}
                  />
                  <div>
                    <button
                      className="cart-item-name"
                      onClick={() => {
                        onClose();
                        onOpenProduct(p.id);
                      }}
                    >
                      {p.name[lang]}
                      {option ? ` — ${option.label[lang]}` : ""}
                    </button>
                    <div className="cart-sku">
                      <bdi>{option?.sku ?? p.sku}</bdi>
                    </div>
                    {p.type !== "component" && (
                      <small>
                        {p.components?.reduce((n, c) => n + c.quantity, 0)}{" "}
                        {t("kitCount")}
                      </small>
                    )}
                    <div className="cart-item-bottom">
                      <Quantity
                        value={item.quantity}
                        onChange={(n) =>
                          setCart((items) =>
                            items.map((current) =>
                              current.productId === p.id &&
                              current.optionId === item.optionId
                                ? { ...current, quantity: n }
                                : current,
                            ),
                          )
                        }
                        t={t}
                      />
                      <bdi>
                        {money((option?.price ?? unitPrice(p)) * item.quantity)}
                      </bdi>
                    </div>
                  </div>
                  <button
                    className="icon-button remove-item"
                    onClick={() =>
                      setCart((items) =>
                        items.filter(
                          (i) =>
                            !(
                              i.productId === p.id &&
                              i.optionId === item.optionId
                            ),
                        ),
                      )
                    }
                    aria-label={`${t("remove")}: ${p.name[lang]}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="cart-summary">
            <div>
              <span>{t("subtotal")}</span>
              <bdi>{money(total)}</bdi>
            </div>
            <div className="cart-total">
              <strong>{t("total")}</strong>
              <strong>
                <bdi>{money(total)}</bdi>
              </strong>
            </div>
            {whatsappOrder(cart, allProducts, store, lang) ? (
              <a
                className="button primary whatsapp-order"
                href={whatsappOrder(cart, allProducts, store, lang)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={19} />
                {t("order")}
                <ArrowUpRight size={17} />
              </a>
            ) : (
              <>
                <p className="notice">{t("unconfigured")}</p>
                <a className="button primary" href={`mailto:${store.email}`}>
                  {t("email")}
                  <Mail size={18} />
                </a>
              </>
            )}
            <p>{t("orderNote")}</p>
            <button className="text-link" onClick={onClose}>
              {t("continue")}
              <ArrowRight size={17} />
            </button>
          </div>
        </>
      ) : (
        <div className="empty-cart">
          <div>
            <ShoppingBag size={42} />
          </div>
          <h3>{t("emptyCart")}</h3>
          <p>{t("emptyCartDescription")}</p>
          <button
            className="button primary"
            onClick={() => {
              onClose();
              onExplore();
            }}
          >
            {t("explore")}
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </Modal>
  );
}
