"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, ShoppingBag, Sparkles } from "lucide-react";
import dictionary from "../../data/translations.json";
import {
  getAllProducts,
  getStoreInfo,
} from "@/services/catalog";
import { sanitizeCart, whatsappOrder } from "@/services/cart";
import type { CartItem, Language, Product } from "@/types";
import type { TranslationKey } from "@/types/i18n";
import ProductDetail from "./ProductDetail";

const allProducts = getAllProducts();
const store = getStoreInfo();

export default function ProductPage({ product }: { product: Product }) {
  const [lang, setLang] = useState<Language>("en");
  const [cart, setCart] = useState<CartItem[]>([]);
  const t = useCallback(
    (key: TranslationKey) => dictionary[lang][key],
    [lang],
  );
  const money = useCallback(
    (amount: number) =>
      new Intl.NumberFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
        style: "currency",
        currency: store.currency,
        maximumFractionDigits: 0,
      })
        .format(amount)
        .replace("NIS", lang === "ar" ? "شيكل" : "NIS"),
    [lang],
  );
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      const savedLanguage = localStorage.getItem("volt-language");
      if (savedLanguage === "ar" || savedLanguage === "en")
        setLang(savedLanguage);
      setCart(
        sanitizeCart(
          JSON.parse(localStorage.getItem("volt-cart") ?? "[]"),
          allProducts,
        ),
      );
    } catch {
      setCart([]);
    }
  }, []);
  const add = (item: Product, quantity: number, optionId?: string) => {
    setCart((items) => {
      const current = items.find((i) => i.productId === item.id)?.quantity ?? 0;
      const next = sanitizeCart(
        [
          ...items.filter((i) => i.productId !== item.id),
          {
            productId: item.id,
            quantity: current + quantity,
            ...(optionId ? { optionId } : {}),
          },
        ],
        allProducts,
      );
      localStorage.setItem("volt-cart", JSON.stringify(next));
      return next;
    });
  };
  const order = (item: Product, quantity: number, optionId?: string) => {
    const url = whatsappOrder(
      [{ productId: item.id, quantity, ...(optionId ? { optionId } : {}) }],
      allProducts,
      store,
      lang,
    );
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const openProduct = (id: string) =>
    window.location.assign(`/product/${encodeURIComponent(id)}`);
  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="simple-header container">
          <Link href="/" className="brand">
            <img src={store.logo} alt="" />
            <span>
              {store.name[lang]}
              <small>{store.tagline[lang]}</small>
            </span>
          </Link>
          <div className="header-actions">
            <button
              className="language-switch"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
            >
              <span className={lang === "en" ? "active" : ""}>EN</span>
              <i />
              <span className={lang === "ar" ? "active" : ""}>عربي</span>
            </button>
            <Link href="/" className="cart-button">
              <ShoppingBag size={22} />
              <span className="cart-label">{t("cart")}</span>
              <span className="cart-count">{cart.reduce((n, i) => n + i.quantity, 0)}</span>
            </Link>
          </div>
        </div>
        <div className="navigation-wrap">
          <nav className="container navigation" aria-label={t("navigation")}>
            <div>
              <Link href="/#home">{t("home")}</Link>
              <Link href="/#products">{t("products")}</Link>
            </div>
            <span className="nav-note">
              <Sparkles size={14} />
              {t("makers")}
            </span>
          </nav>
        </div>
      </header>
      <div className="container product-page-content">
        <Link href="/" className="text-link product-back-link">
          {t("back")}
        </Link>
        <ProductDetail
          product={product}
          lang={lang}
          t={t}
          money={money}
          add={add}
          order={order}
          openProduct={openProduct}
        />
      </div>
      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand">
              <img src={store.logo} alt="" />
              <span>{store.name[lang]}</span>
            </Link>
            <p>{store.description[lang]}</p>
            <span className="footer-spark">
              <Sparkles size={15} />
              {t("footerLine")}
            </span>
          </div>
          <div>
            <h3>{t("shop")}</h3>
            <Link href="/#products">{t("products")}</Link>
          </div>
          <div>
            <h3>{t("connect")}</h3>
            <a href={`mailto:${store.email}`}>
              <bdi>{store.email}</bdi>
              <ArrowUpRight size={14} />
            </a>
            {store.socials.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.name}
                <ExternalLink size={14} />
              </a>
            ))}
            <p className="footer-contact-note">{store.contactNote[lang]}</p>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} {store.name[lang]}.{" "}
            {store.copyright[lang]}
          </span>
          <span>
            <span className="pulse-dot" />
            {store.tagline[lang]}
          </span>
        </div>
      </footer>
    </main>
  );
}
