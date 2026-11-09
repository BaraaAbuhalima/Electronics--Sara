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
  ChevronDown,
  SlidersHorizontal,
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
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import dictionary from "../../data/translations.json";
import {
  dataErrors,
  getAllCategories,
  getAllProducts,
  getProductById,
  getStoreInfo,
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
  categories = getAllCategories(),
  store = getStoreInfo();
const heroProducts = (store.hero.productIds ?? []).map(getProductById);
const heroKit = getProductById(store.hero.kitProductId ?? "");
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
    [category, setCategory] = useState("all"),
    [type, setType] = useState("all"),
    [sort, setSort] = useState("recommended"),
    [tab, setTab] = useState<"featured" | "newArrival" | "bestSeller">(
      "featured",
    ),
    [toast, setToast] = useState(""),
    [storageWarning, setStorageWarning] = useState(false),
    [mailReady, setMailReady] = useState(false);
  const t = useCallback((key: TranslationKey) => dictionary[lang][key], [lang]);
  const money = useCallback(
    (amount: number) =>
      new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
        style: "currency",
        currency: store.currency,
      }).format(amount),
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
      if (hash === "products" || hash === "kits") {
        setView("catalog");
        if (hash === "kits") setType("grouped");
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
    if (target === "products" || target === "kits") {
      setView("catalog");
      setType(target === "kits" ? "grouped" : "all");
      setCategory("all");
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
    window.location.hash = `product/${encodeURIComponent(id)}`;
    setSelectedId(id);
  };
  const add = (product: Product, quantity = 1) => {
    const current = cart.find((c) => c.productId === product.id)?.quantity ?? 0;
    if (product.stock <= current) {
      setToast(t("stockLimit"));
      return;
    }
    setCart((items) =>
      sanitizeCart(
        [...items, { productId: product.id, quantity }],
        allProducts,
      ),
    );
    setToast(t("added"));
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
        (p.name.en + " " + p.name.ar + " " + p.sku)
          .toLowerCase()
          .includes(query.toLowerCase().trim()) &&
        (category === "all" || p.categoryId === category) &&
        (type === "all" ||
          (type === "grouped" ? p.type !== "component" : p.type === type)),
    );
    return [...result].sort((a, b) =>
      sort === "priceLow"
        ? unitPrice(a) - unitPrice(b)
        : sort === "priceHigh"
          ? unitPrice(b) - unitPrice(a)
          : sort === "alphabetical"
            ? a.name[lang].localeCompare(b.name[lang], lang)
            : Number(!!b.featured) - Number(!!a.featured),
    );
  }, [query, category, type, sort, lang]);
  const shopCategory = (id: string) => {
    navigate("products");
    setCategory(id);
  };
  const navItems: [string, TranslationKey][] = [
    ["home", "home"],
    ["products", "products"],
    ["categories", "categories"],
    ["kits", "kits"],
    ["about", "about"],
    ["contact", "contact"],
  ];
  const selected = selectedId ? getProductById(selectedId) : null;
  return (
    <>
      <div className="announcement">
        <span>
          <Zap size={13} />
          {t("demo")}
        </span>
        <span className="announcement-right">
          {store.tagline[lang]}
          <ArrowUpRight size={13} />
        </span>
      </div>
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
              setType("all");
              setCategory("all");
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
                  {id === "categories" && <ChevronDown size={12} />}
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
                  <p>{store.hero.description[lang]}</p>
                  <div className="hero-buttons">
                    <button
                      className="button primary"
                      onClick={() => navigate("products")}
                    >
                      {t("explore")}
                      <ArrowRight size={18} />
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => navigate("kits")}
                    >
                      {t("discover")}
                      <ArrowUpRight size={18} />
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
                <div className="hero-visual" aria-label={t("heroCard")}>
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
                  <div className="floating-component floating-esp">
                    <SafeImage
                      src={heroProducts[1]?.images[0] ?? "/images/fallback.svg"}
                      alt={heroProducts[1]?.name[lang] ?? t("image")}
                    />
                  </div>
                  <div className="floating-component floating-motor">
                    <SafeImage
                      src={heroProducts[2]?.images[0] ?? "/images/fallback.svg"}
                      alt={heroProducts[2]?.name[lang] ?? t("image")}
                    />
                  </div>
                  <div className="floating-component floating-led">
                    <SafeImage
                      src={heroProducts[3]?.images[0] ?? "/images/fallback.svg"}
                      alt={heroProducts[3]?.name[lang] ?? t("image")}
                    />
                  </div>
                  <div className="hero-info">
                    <span className="info-icon">
                      <Zap size={22} />
                    </span>
                    <div>
                      <strong>{t("heroCard")}</strong>
                      <span>{t("heroCardSub")}</span>
                    </div>
                    <ArrowUpRight size={19} />
                  </div>
                  <span className="coordinate">V.01 / ∞</span>
                </div>
              </div>
            </section>
            <section className="trust-strip">
              <div className="container">
                <span>
                  <ShieldCheck />
                  {t("quality")}
                </span>
                <span>
                  <Headphones />
                  {t("support")}
                </span>
                <span>
                  <Package />
                  {t("makers")}
                </span>
                <span className="trust-last">
                  <Layers />
                  {t("heroTag")}
                </span>
              </div>
            </section>
            <section className="section container" id="categories">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">{t("categoryEyebrow")}</div>
                  <h2>{t("categoryTitle")}</h2>
                  <p>{t("categoryDescription")}</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => navigate("products")}
                >
                  {t("browseAll")}
                  <ArrowUpRight size={17} />
                </button>
              </div>
              <div className="category-grid">
                {categories.map((c) => (
                  <button
                    className="category-card"
                    onClick={() => shopCategory(c.id)}
                    key={c.id}
                  >
                    <div className="category-image">
                      <SafeImage
                        src={c.image}
                        alt={c.name[lang]}
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h3>{c.name[lang]}</h3>
                      <p>{c.description[lang]}</p>
                    </div>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
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
                  <button
                    className="text-link"
                    onClick={() => navigate("products")}
                  >
                    {t("viewAll")}
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <div
                  className="product-tabs"
                  role="tablist"
                  aria-label={t("products")}
                >
                  {(
                    [
                      ["featured", "featured"],
                      ["newArrival", "new"],
                      ["bestSeller", "best"],
                    ] as const
                  )
                    .filter(([flag]) => allProducts.some((p) => p[flag]))
                    .map(([flag, key]) => (
                      <button
                        role="tab"
                        aria-selected={tab === flag}
                        key={flag}
                        onClick={() => setTab(flag)}
                        className={tab === flag ? "active" : ""}
                      >
                        {t(key)}
                        {tab === flag && (
                          <span>
                            {allProducts.filter((p) => p[flag]).length}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
                <div className="product-grid">
                  {allProducts
                    .filter((p) => p[tab])
                    .slice(0, 4)
                    .map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        lang={lang}
                        t={t}
                        money={money}
                        add={add}
                        openProduct={openProduct}
                      />
                    ))}
                </div>
              </div>
            </section>
            <section className="section container" id="kits-section">
              <div className="kit-banner">
                <div className="kit-banner-copy">
                  <div className="eyebrow">{t("kitsEyebrow")}</div>
                  <h2>{t("kitsTitle")}</h2>
                  <p>{t("kitsDescription")}</p>
                  <button
                    className="button primary"
                    onClick={() => navigate("kits")}
                  >
                    {t("discover")}
                    <ArrowRight size={18} />
                  </button>
                  <div className="kit-checks">
                    <span>
                      <Check size={14} />
                      {t("quality")}
                    </span>
                    <span>
                      <Check size={14} />
                      {t("makers")}
                    </span>
                  </div>
                </div>
                <div className="kit-banner-art">
                  <div className="kit-box">
                    <SafeImage
                      src={heroKit?.images[0] ?? "/images/fallback.svg"}
                      alt={heroKit?.name[lang] ?? t("image")}
                    />
                    <span>
                      {store.name[lang]}
                      <small>{t("heroTag")}</small>
                    </span>
                  </div>
                  <div className="kit-floating-tag">
                    <Package size={18} />
                    {t("kitCount")}
                  </div>
                </div>
              </div>
              <div className="mini-kit-grid">
                {allProducts
                  .filter((p) => p.type !== "component")
                  .map((p) => (
                    <button
                      className="mini-kit"
                      key={p.id}
                      onClick={() => openProduct(p.id)}
                    >
                      <SafeImage
                        src={p.images[0]}
                        alt={p.name[lang]}
                        loading="lazy"
                      />
                      <div>
                        <span className="micro-label">
                          {t(p.type)} ·{" "}
                          {p.components?.reduce((s, c) => s + c.quantity, 0)}{" "}
                          {t("items")}
                        </span>
                        <h3>{p.name[lang]}</h3>
                        <span className="mini-price">
                          <bdi>{money(unitPrice(p))}</bdi>
                          {p.discountPrice != null && (
                            <del>
                              <bdi>{money(p.price)}</bdi>
                            </del>
                          )}
                        </span>
                      </div>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
              </div>
            </section>
            <section className="section why-section">
              <div className="container">
                <div className="center-heading">
                  <div className="eyebrow">{t("whyEyebrow")}</div>
                  <h2>{t("whyTitle")}</h2>
                </div>
                <div className="why-grid">
                  {[
                    [ShieldCheck, "qualityTitle", "qualityDescription"],
                    [Zap, "priceTitle", "priceDescription"],
                    [HeartHandshake, "supportTitle", "supportDescription"],
                    [Layers, "allTitle", "allDescription"],
                  ].map(([Icon, title, description]) => {
                    const I = Icon as typeof ShieldCheck;
                    return (
                      <article key={title as string}>
                        <div className="why-icon">
                          <I size={24} />
                        </div>
                        <h3>{t(title as TranslationKey)}</h3>
                        <p>{t(description as TranslationKey)}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
            <section className="section container about-section" id="about">
              <div className="about-art">
                <div className="about-dots" />
                <Zap size={110} strokeWidth={1.1} />
                <span>{store.tagline[lang]}</span>
              </div>
              <div>
                <div className="eyebrow">{t("aboutEyebrow")}</div>
                <h2>{t("aboutTitle")}</h2>
                <p>{store.about[lang]}</p>
                <button
                  className="text-link"
                  onClick={() => navigate("contact")}
                >
                  {t("contact")}
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </section>
            <section className="contact-section" id="contact">
              <div className="container contact-grid">
                <div>
                  <div className="eyebrow">{t("contactEyebrow")}</div>
                  <h2>{t("contactTitle")}</h2>
                  <p>{t("contactDescription")}</p>
                  {/^\d{7,15}$/.test(store.whatsapp) ? (
                    <a
                      className="contact-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://wa.me/${store.whatsapp}`}
                    >
                      <MessageCircle />
                      {t("whatsapp")}
                      <ArrowUpRight size={17} />
                    </a>
                  ) : (
                    <p className="contact-config-note">{t("unconfigured")}</p>
                  )}
                  <a className="contact-link" href={`mailto:${store.email}`}>
                    <Mail />
                    <bdi>{store.email}</bdi>
                    <ArrowUpRight size={17} />
                  </a>
                  <p className="demo-note">{store.contactNote[lang]}</p>
                  {store.socials.map((s) => (
                    <a
                      className="contact-link"
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {s.name}
                      <ExternalLink size={16} />
                    </a>
                  ))}
                </div>
                <form
                  className="contact-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const subject = `${store.name[lang]} — ${form.get("name")}`;
                    const body = `${form.get("message")}\n\n${form.get("name")}\n${form.get("email")}`;
                    window.location.href = `mailto:${store.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    setMailReady(true);
                  }}
                >
                  <div className="form-row">
                    <label>
                      {t("name")}
                      <input
                        name="name"
                        required
                        maxLength={100}
                        autoComplete="name"
                      />
                    </label>
                    <label>
                      {t("emailLabel")}
                      <input
                        name="email"
                        type="email"
                        required
                        maxLength={200}
                        autoComplete="email"
                        dir="ltr"
                      />
                    </label>
                  </div>
                  <label>
                    {t("message")}
                    <textarea
                      name="message"
                      required
                      rows={4}
                      maxLength={3000}
                    />
                  </label>
                  <div className="form-bottom">
                    <p>{t("formNote")}</p>
                    <button type="submit" className="button primary">
                      {t("send")}
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  {mailReady && <p role="status">{t("emailReady")}</p>}
                </form>
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
              <SlidersHorizontal size={18} />
              <label>
                <span className="sr-only">{t("category")}</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">{t("allCategories")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[lang]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">{t("allTypes")}</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="all">{t("allTypes")}</option>
                  <option value="component">{t("component")}</option>
                  <option value="kit">{t("kit")}</option>
                  <option value="bundle">{t("bundle")}</option>
                  <option value="grouped">{t("kits")}</option>
                </select>
              </label>
              <button
                className="clear-filter"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setType("all");
                  setSort("recommended");
                }}
              >
                {t("clearFilters")}
              </button>
              <label className="sort-control">
                <span>{t("sort")}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  {(
                    [
                      "recommended",
                      "priceLow",
                      "priceHigh",
                      "alphabetical",
                    ] as const
                  ).map((k) => (
                    <option key={k} value={k}>
                      {t(k)}
                    </option>
                  ))}
                </select>
              </label>
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
            <h3>{t("categories")}</h3>
            {categories.map((c) => (
              <a
                href="#products"
                key={c.id}
                onClick={(e) => {
                  e.preventDefault();
                  shopCategory(c.id);
                }}
              >
                {c.name[lang]}
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
            <p className="footer-demo">{store.contactNote[lang]}</p>
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
                  return (
                    <div className="cart-item" key={p.id}>
                      <SafeImage src={p.images[0]} alt={p.name[lang]} />
                      <div>
                        <button
                          className="cart-item-name"
                          onClick={() => {
                            setCartOpen(false);
                            openProduct(p.id);
                          }}
                        >
                          {p.name[lang]}
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
                            max={p.stock}
                            onChange={(n) => update(p.id, n)}
                            t={t}
                          />
                          <bdi>{money(unitPrice(p) * item.quantity)}</bdi>
                        </div>
                      </div>
                      <button
                        className="icon-button remove-item"
                        onClick={() =>
                          setCart((items) =>
                            items.filter((i) => i.productId !== p.id),
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
