"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  ShoppingBag,
  Plus,
  Check,
  Menu,
  X,
  Zap,
  ShieldCheck,
  Headphones,
  Package,
  Layers,
  Trash2,
  Mail,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import dictionary from "../../data/translations.json";
import {
  dataErrors,
  getAllProducts,
  getProductById,
  getStoreInfo,
  getAllCategories,
  unitPrice,
} from "@/services/catalog";
import { cartTotalCents, sanitizeCart, whatsappOrder } from "@/services/cart";
import type { CartItem, Language, Product } from "@/types";
import SafeImage from "./SafeImage";
import Modal from "./Modal";
import ProductCard from "./ProductCard";
import ProductDetail from "./ProductDetail";
import Quantity from "./Quantity";
const allProducts = getAllProducts(),
  store = getStoreInfo(),
  categories = getAllCategories();
const heroProducts = (store.hero.productIds ?? []).map(getProductById);
import type { TranslationKey } from "@/types/i18n";
function readHash() {
  if (typeof window === "undefined") return "";
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}
export default function Storefront() {
  const [lang, setLang] = useState<Language>("en"),
    [hydrated, setHydrated] = useState(false),
    [cart, setCart] = useState<CartItem[]>([]),
    [cartOpen, setCartOpen] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false),
    [view, setView] = useState<"home" | "catalog">("home"),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [categoryId, setCategoryId] = useState("all"),
    [toast, setToast] = useState(""),
    [storageWarning, setStorageWarning] = useState(false);
  const t = useCallback((key: TranslationKey) => dictionary[lang][key], [lang]);
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
    try {
      const language = localStorage.getItem("volt-language");
      if (language === "ar" || language === "en") setLang(language);
      setCart(
        sanitizeCart(
          JSON.parse(localStorage.getItem("volt-cart") ?? "[]"),
          allProducts,
        ),
      );
    } catch {
      setStorageWarning(true);
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (hydrated)
      try {
        localStorage.setItem("volt-language", lang);
        localStorage.setItem("volt-cart", JSON.stringify(cart));
      } catch {
        setStorageWarning(true);
      }
  }, [lang, cart, hydrated]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const sync = () => {
      const hash = readHash();
      setSelectedId(hash.startsWith("product/") ? hash.slice(8) : null);
      if (hash === "products") {
        setView("catalog");
      } else if (!hash.startsWith("product/")) {
        setView("home");
        if (hash)
          setTimeout(
            () =>
              document
                .getElementById(hash)
                ?.scrollIntoView({ behavior: "smooth" }),
            60,
          );
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const navigate = useCallback((target: string) => {
    setMobileOpen(false);
    setSelectedId(null);
    if (target === "products") {
      setView("catalog");
      setQuery("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setView("home");
      setTimeout(
        () =>
          target === "home"
            ? window.scrollTo({ top: 0, behavior: "smooth" })
            : document
                .getElementById(target)
                ?.scrollIntoView({ behavior: "smooth" }),
        60,
      );
    }
    window.location.hash = target;
  }, []);
  const closeProduct = useCallback(() => {
    setSelectedId(null);
    history.replaceState(null, "", view === "catalog" ? "#products" : "#home");
  }, [view]);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openProduct = (id: string) => {
    window.location.assign(`/product/${encodeURIComponent(id)}`);
  };
  const add = (product: Product, quantity = 1, optionId?: string) => {
    const option = product.optionGroups
      ?.flatMap((group) => group.options)
      .find((candidate) => candidate.id === optionId);
    if (!product.inStock || (optionId && (!option || !option.inStock))) {
      setToast(t("stockLimit"));
      return;
    }
    setCart((items) =>
      sanitizeCart(
        [...items, { productId: product.id, quantity, ...(optionId ? { optionId } : {}) }],
        allProducts,
      ),
    );
    setToast(t("added"));
  };
  const order = (product: Product, quantity = 1, optionId?: string) => {
    const url = whatsappOrder(
      [{ productId: product.id, quantity, ...(optionId ? { optionId } : {}) }],
      allProducts,
      store,
      lang,
    );
    if (!url) {
      setToast(t("unconfigured"));
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const update = (id: string, quantity: number) =>
    setCart((items) =>
      sanitizeCart(
        items.map((i) => (i.productId === id ? { ...i, quantity } : i)),
        allProducts,
      ),
    );
  const count = cart.reduce((n, i) => n + i.quantity, 0),
    total = cartTotalCents(cart, allProducts) / 100;
  const filtered = useMemo(() => {
    const result = allProducts.filter(
      (p) =>
        (categoryId === "all" || p.categoryId === categoryId) &&
        (p.name.en + " " + p.name.ar + " " + p.sku)
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
    );
    return [...result].sort(
      (a, b) => Number(!!b.featured) - Number(!!a.featured),
    );
  }, [query, categoryId]);
  const navItems: [string, TranslationKey][] = [
    ["home", "home"],
    ["products", "products"],
  ];
  const selected = selectedId ? getProductById(selectedId) : null;
  return (
    <>
      <header className="site-header">
        <div className="header-main container">
          <a
            href="#home"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigate("home");
            }}
          >
            <SafeImage src={store.logo} alt="" />
            <span>
              {store.name[lang]}
              <small>{store.tagline[lang]}</small>
            </span>
          </a>
          <form
            className="header-search"
            onSubmit={(e) => {
              e.preventDefault();
              setView("catalog");
              window.location.hash = "products";
              window.scrollTo(0, 0);
            }}
          >
            <Search size={19} />
            <input
              aria-label={t("searchProducts")}
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <div className="header-actions">
            <button
              className="language-switch"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              aria-label={
                lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"
              }
            >
              <span className={lang === "en" ? "active" : ""}>EN</span>
              <i />
              <span className={lang === "ar" ? "active" : ""}>عربي</span>
            </button>
            <span className="header-divider" />
            <button
              className="cart-button"
              onClick={() => setCartOpen(true)}
              aria-label={`${t("cart")} (${count})`}
            >
              <ShoppingBag size={22} />
              <span className="cart-label">{t("cart")}</span>
              <span className="cart-count">{count}</span>
            </button>
            <button
              className="icon-button mobile-toggle"
              aria-label={t("menu")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        <div className={`navigation-wrap ${mobileOpen ? "is-open" : ""}`}>
          <nav className="container navigation" aria-label={t("navigation")}>
            <div>
              {navItems.map(([id, key]) => (
                <a
                  href={`#${id}`}
                  className={
                    (view === "home" && id === "home") ||
                    (view === "catalog" && id === "products")
                      ? "current"
                      : ""
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(id);
                  }}
                  key={id}
                >
                  {t(key)}
                </a>
              ))}
            </div>
            <span className="nav-note">
              <Sparkles size={14} />
              {t("makers")}
            </span>
          </nav>
        </div>
      </header>
      {dataErrors.length > 0 && (
        <div className="notice container" role="alert">
          {t("dataWarning")}
        </div>
      )}
      {storageWarning && (
        <div className="notice container">{t("storageWarning")}</div>
      )}
      <main>
        {view === "home" ? (
          <>
            <section className="hero">
              <div className="container hero-inner">
                <div className="hero-copy">
                  <div className="eyebrow">
                    <span />
                    {store.hero.eyebrow[lang]}
                  </div>
                  <h1>
                    {store.hero.title[lang].split("\n").map((line, i) => (
                      <span key={line} className={i === 1 ? "blue" : ""}>
                        {line}
                      </span>
                    ))}
                  </h1>
                  {store.hero.description[lang] && (
                    <p>{store.hero.description[lang]}</p>
                  )}
                  <div className="hero-buttons">
                    <button
                      className="button primary"
                      onClick={() => navigate("products")}
                    >
                      {t("explore")}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                  <div className="hero-small">
                    <div className="tiny-avatars">
                      <span>⌁</span>
                      <span>↯</span>
                      <span>✳</span>
                    </div>
                    <span>{t("heroTag")}</span>
                    <span className="small-dash" />
                  </div>
                </div>
                <div className="hero-visual" aria-label={t("heroTag")}>
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="visual-cross cross-one">+</div>
                  <div className="visual-cross cross-two">+</div>
                  <div className="visual-label">
                    <span className="pulse-dot" />
                    {t("heroTag")}
                  </div>
                  <div className="hero-board">
                    <SafeImage
                      src={heroProducts[0]?.images[0] ?? "/images/fallback.svg"}
                      alt={heroProducts[0]?.name[lang] ?? t("image")}
                      loading="eager"
                    />
                  </div>
                  <div className="hero-info">
                    <div>
                      <span>{t("heroCardSub")}</span>
                    </div>
                    <ArrowUpRight size={19} />
                  </div>
                  <span className="coordinate">V.01 / ∞</span>
                </div>
              </div>
            </section>
            <section className="section featured-section" id="featured">
              <div className="container">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">{t("featuredEyebrow")}</div>
                    <h2>{t("featuredTitle")}</h2>
                    <p>{t("featuredDescription")}</p>
                  </div>
                </div>
                <div className="product-grid">
                  {allProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      lang={lang}
                      t={t}
                      money={money}
                      add={add}
                      order={order}
                      openProduct={openProduct}
                    />
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="catalog container">
            <div className="catalog-header">
              <div className="eyebrow">{t("catalogEyebrow")}</div>
              <h1>{t("catalogTitle")}</h1>
              <p>{t("categoryDescription")}</p>
            </div>
            <div className="catalog-search">
              <Search size={20} />
              <input
                placeholder={t("search")}
                aria-label={t("searchProducts")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  className="icon-button"
                  onClick={() => setQuery("")}
                  aria-label={t("clearFilters")}
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <div className="catalog-filters">
              <label htmlFor="category-filter">{t("category")}</label>
              <select
                id="category-filter"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="all">{t("allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div className="results-count">
              <b>{filtered.length}</b> {t("results")}
            </div>
            {filtered.length ? (
              <div className="product-grid catalog-grid">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    lang={lang}
                    t={t}
                    money={money}
                    add={add}
                    order={order}
                    openProduct={openProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-results">
                <Search size={40} />
                <p>{t("noResults")}</p>
              </div>
            )}
          </section>
        )}
      </main>
      <footer>
        <div className="container footer-grid">
          <div className="footer-brand">
            <a
              href="#home"
              className="brand"
              onClick={(e) => {
                e.preventDefault();
                navigate("home");
              }}
            >
              <SafeImage src={store.logo} alt="" />
              <span>{store.name[lang]}</span>
            </a>
            <p>{store.description[lang]}</p>
            <span className="footer-spark">
              <Zap size={15} />
              {t("footerLine")}
            </span>
          </div>
          <div>
            <h3>{t("shop")}</h3>
            {navItems.slice(1).map(([id, key]) => (
              <a
                href={`#${id}`}
                key={id}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(id);
                }}
              >
                {t(key)}
              </a>
            ))}
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
      {selectedId && (
        <Modal
          title={selected?.name[lang] ?? t("unavailable")}
          closeLabel={t("close")}
          onClose={closeProduct}
        >
          {selected ? (
            <ProductDetail
              key={selected.id}
              product={selected}
              lang={lang}
              t={t}
              money={money}
              add={add}
              order={order}
              openProduct={openProduct}
            />
          ) : (
            <div className="empty-results">
              <Package size={40} />
              <h2>{t("unavailable")}</h2>
              <p>{t("unavailableDescription")}</p>
              <button
                className="button primary"
                onClick={() => navigate("products")}
              >
                {t("viewAll")}
              </button>
            </div>
          )}
        </Modal>
      )}
      {cartOpen && (
        <Modal
          drawer
          title={t("cart")}
          closeLabel={t("close")}
          onClose={closeCart}
        >
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
                    <div className="cart-item" key={`${p.id}-${item.optionId ?? ""}`}>
                      <SafeImage src={p.images[0]} alt={p.name[lang]} />
                      <div>
                        <button
                          className="cart-item-name"
                          onClick={() => {
                            setCartOpen(false);
                            openProduct(p.id);
                          }}
                        >
                          {p.name[lang]}{option ? ` — ${option.label[lang]}` : ""}
                        </button>
                        <div className="cart-sku">
                          <bdi>{p.sku}</bdi>
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
                          <bdi>{money((option?.price ?? unitPrice(p)) * item.quantity)}</bdi>
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
                    <a
                      className="button primary"
                      href={`mailto:${store.email}`}
                    >
                      {t("email")}
                      <Mail size={18} />
                    </a>
                  </>
                )}
                <p>{t("orderNote")}</p>
                <button className="text-link" onClick={closeCart}>
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
                  closeCart();
                  navigate("products");
                }}
              >
                {t("explore")}
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
