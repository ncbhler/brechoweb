import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { getProducts, getSectorsAndCategoriesFromProducts } from "./lib/products";
import type { Product, ProductsFeed, ProductsPagination, Sector } from "./types";

type Route = "catalogo" | "sobre" | "checkout";

const SECTORS: Sector[] = ["Feminino", "Masculino", "Infantil"];
type SectorFilter = Sector | "Todos";

const SPECIAL_CATEGORIES = {
  Novidades: "Novidades"
} as const;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DEBOUNCE_MS = 350;

const isNewlyReleased = (createdAt: Date, now: Date = new Date()) => {
  const time = createdAt.getTime();
  const nowMs = now.getTime();
  return Number.isFinite(time) && time > nowMs - SEVEN_DAYS_MS && time <= nowMs + 60_000;
};

const normalizeForSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeCategoryKey = (value: string) => {
  const base = normalizeForSearch(value);
  const withoutTrailingS = base.endsWith("s") ? base.slice(0, -1) : base;
  return withoutTrailingS || base;
};

const sameCategoryFuzzy = (a: string, b: string) =>
  normalizeCategoryKey(a) === normalizeCategoryKey(b);

const findCategoryFuzzy = (list: string[], target: string) =>
  list.find((candidate) => sameCategoryFuzzy(candidate, target));

const ROUTES: Array<{ key: Route; label: string }> = [
  { key: "catalogo", label: "Produtos" },
  { key: "sobre", label: "Sobre o BrechoWeb" }
];

type PaymentMethod = "pix" | "card" | "boleto";

type CheckoutForm = {
  fullName: string;
  phone: string;
  cpf: string;
  payment: PaymentMethod;
};

const initialCheckoutForm: CheckoutForm = {
  fullName: "",
  phone: "",
  cpf: "",
  payment: "pix"
};

const phoneMask = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const cpfMask = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const cepMask = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M10.5 4.75a5.75 5.75 0 1 0 0 11.5a5.75 5.75 0 0 0 0-11.5Zm0-1.5a7.25 7.25 0 1 1 0 14.5a7.25 7.25 0 0 1 0-14.5Zm6.17 12.36l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08a.75.75 0 0 1 1.06-1.06Z"
      fill="currentColor"
    />
  </svg>
);

const CartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3.75 4.5a.75.75 0 0 1 .75-.75h1.58c.74 0 1.39.5 1.57 1.22l.15.61h11.7a1.5 1.5 0 0 1 1.46 1.87l-1.36 5.42a1.5 1.5 0 0 1-1.46 1.13H9.32a1.5 1.5 0 0 1-1.46-1.13L6.2 6.25H4.5a.75.75 0 0 1-.75-.75Zm4.44 2.58 1.12 4.42h8.98l1.11-4.42H8.19ZM9.5 18.5a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0Zm8.5 0a1.25 1.25 0 1 1-2.5 0a1.25 1.25 0 0 1 2.5 0Z"
      fill="currentColor"
    />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M4 6.75A.75.75 0 0 1 4.75 6h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 6.75Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 12Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 17.25Z"
      fill="currentColor"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M15.28 4.22a.75.75 0 0 1 0 1.06L9.56 11h9.69a.75.75 0 0 1 0 1.5H9.56l5.72 5.72a.75.75 0 0 1-1.06 1.06l-7-7a.75.75 0 0 1 0-1.06l7-7a.75.75 0 0 1 1.06 0Z"
      fill="currentColor"
    />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M6.22 6.22a.75.75 0 0 1 1.06 0L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L10.94 12L6.22 7.28a.75.75 0 0 1 0-1.06Z"
      fill="currentColor"
    />
  </svg>
);

const HangerPlaceholder = ({
  title,
  subtitle
}: {
  title: string;
  subtitle?: string;
}) => (
  <svg
    className="product-card__placeholder-svg"
    viewBox="0 0 320 400"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    role="img"
  >
    <defs>
      <linearGradient id="hangerBg" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#fff0f6" />
        <stop offset="55%" stopColor="#fad8e5" />
        <stop offset="100%" stopColor="#f4c0d3" />
      </linearGradient>
      <linearGradient id="hangerMetal" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#b5b9c2" />
        <stop offset="100%" stopColor="#858a94" />
      </linearGradient>
      <pattern
        id="hangerDots"
        x="0"
        y="0"
        width="14"
        height="14"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.42)" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="320" height="400" fill="url(#hangerBg)" />
    <rect x="0" y="0" width="320" height="400" fill="url(#hangerDots)" />
    <line
      x1="160"
      y1="44"
      x2="160"
      y2="118"
      stroke="url(#hangerMetal)"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M160 62 C172 62, 182 72, 182 86"
      fill="none"
      stroke="url(#hangerMetal)"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M76 196 L76 168 C76 144, 122 122, 160 122 C198 122, 244 144, 244 168 L244 196"
      fill="none"
      stroke="url(#hangerMetal)"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M70 202 C58 228, 52 260, 52 300 C52 350, 92 376, 160 376 C228 376, 268 350, 268 300 C268 260, 262 228, 250 202 L236 202 C248 226, 254 256, 254 298 C254 340, 222 362, 160 362 C98 362, 66 340, 66 298 C66 256, 72 226, 84 202 Z"
      fill="rgba(255,255,255,0.5)"
    />
    <line
      x1="160"
      y1="122"
      x2="160"
      y2="196"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="4"
      strokeDasharray="6 8"
      strokeLinecap="round"
    />
    <text
      x="160"
      y="260"
      textAnchor="middle"
      fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
      fontSize="26"
      fontWeight="800"
      fill="#c13563"
      letterSpacing="-0.02em"
    >
      {title}
    </text>
    {subtitle ? (
      <text
        x="160"
        y="296"
        textAnchor="middle"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="16"
        fontWeight="500"
        fill="rgba(146, 38, 77, 0.75)"
      >
        {subtitle}
      </text>
    ) : null}
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M14.5 4.25a2.75 2.75 0 1 1 2.47 2.73l-4.65 2.46a2.75 2.75 0 0 1-3.29 0L4.47 6.77A2.75 2.75 0 1 1 5.03 5.3l4.56 2.41a1.25 1.25 0 0 0 1.5 0l4.8-2.54A2.75 2.75 0 0 1 14.5 4.25Zm-8 1.25a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3Zm8 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3ZM3.25 18.25a2.75 2.75 0 1 1 5.5 0a2.75 2.75 0 0 1-5.5 0Zm1.5 0a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 0 0-2.5 0Zm11.78-4.52-4.65 2.46a2.75 2.75 0 0 0 3.29 0l4.56-2.41a2.75 2.75 0 1 1 .56 1.47l-4.8 2.54a1.25 1.25 0 0 1-1.5 0l-4.65-2.46a2.75 2.75 0 0 1-.9-4.29a2.75 2.75 0 0 1 2.86.39l4.56 2.41a2.75 2.75 0 0 1 1.13 2.49Z"
      fill="currentColor"
    />
  </svg>
);

const ZoomInIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M11 5.25a5.75 5.75 0 1 1 0 11.5a5.75 5.75 0 0 1 0-11.5Zm0-1.5a7.25 7.25 0 1 0 4.58 12.63l3.27 3.27a.75.75 0 1 0 1.06-1.06l-3.27-3.27A7.25 7.25 0 0 0 11 3.75ZM11.75 8a.75.75 0 0 0-1.5 0v2.25H8a.75.75 0 0 0 0 1.5h2.25V14a.75.75 0 0 0 1.5 0v-2.25H14a.75.75 0 0 0 0-1.5h-2.25V8Z"
      fill="currentColor"
    />
  </svg>
);

const ProductSkeleton = () => (
  <article className="product-card product-card--skeleton" aria-hidden="true">
    <div className="skeleton skeleton-image" />
    <div className="product-card__body">
      <div className="skeleton skeleton-chip" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-copy" />
      <div className="skeleton skeleton-copy short" />
      <div className="skeleton skeleton-footer" />
    </div>
  </article>
);

const ProductCard = ({
  product,
  onAddToCart,
  onOpenDetails
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDetails?: (product: Product) => void;
}) => {
  const openDetails = () => {
    if (onOpenDetails) {
      onOpenDetails(product);
    }
  };

  const hasImage = Boolean(product.imageUrl && product.imageUrl.trim());
  const placeholderLabel =
    product.category && product.category.length > 14
      ? product.category.slice(0, 14)
      : product.category || product.sector;
  const placeholderSub =
    product.size && product.size !== "Unico" ? product.size : undefined;

  return (
    <article className="product-card">
      <button
        type="button"
        className="product-card__image-button"
        onClick={openDetails}
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <div className="product-card__image-wrap">
          {hasImage ? (
            <img
              className="product-card__image"
              src={product.imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                if (event.currentTarget.parentElement) {
                  event.currentTarget.style.display = "none";
                }
              }}
            />
          ) : (
            <HangerPlaceholder title={placeholderLabel} subtitle={placeholderSub} />
          )}
        </div>
      </button>

      <div className="product-card__body">
        <div className="product-card__top">
          <div className="product-card__meta">
            <span className="product-card__size">{product.size}</span>
            <span className="product-card__condition">{product.condition}</span>
          </div>
          <div className="product-card__price">
            <span>{priceFormatter.format(product.price)}</span>
          </div>
        </div>

        <button
          type="button"
          className="product-card__title"
          onClick={openDetails}
        >
          <h3>{product.name}</h3>
        </button>

        <p className="product-card__description">{product.description}</p>

        <div className="product-card__footer">
          <button
            type="button"
            className="button product-card__cta"
            onClick={() => onAddToCart(product)}
          >
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </article>
  );
};

const PageHeader = ({
  eyebrow,
  title,
  description,
  onBack
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  onBack?: () => void;
}) => (
  <div className="page-header">
    {onBack ? (
      <button type="button" className="page-header__back" onClick={onBack}>
        <ArrowLeftIcon />
        Voltar ao catalogo
      </button>
    ) : null}

    <div className="section-heading">
      <div>
        {eyebrow ? (
          <span className="eyebrow eyebrow--muted">{eyebrow}</span>
        ) : null}
        <h1>{title}</h1>
      </div>
      {description ? <p>{description}</p> : null}
    </div>
  </div>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 4.75a.75.75 0 0 1 .75.75v5.75H18.5a.75.75 0 0 1 0 1.5h-5.75V18.5a.75.75 0 0 1-1.5 0v-5.75H5.5a.75.75 0 0 1 0-1.5h5.75V5.5A.75.75 0 0 1 12 4.75Z"
      fill="currentColor"
    />
  </svg>
);

const MinusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5.5 11.25a.75.75 0 0 1 0-1.5h13a.75.75 0 0 1 0 1.5h-13Z"
      fill="currentColor"
    />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M10.5 3.75h3a1.5 1.5 0 0 1 1.5 1.5v0.5h3.5a0.75 0.75 0 0 1 0 1.5h-14a0.75 0.75 0 0 1 0-1.5H9v-0.5a1.5 1.5 0 0 1 1.5-1.5Zm6.75 4.5v9.25a2.5 2.5 0 0 1-2.5 2.5h-4.5a2.5 2.5 0 0 1-2.5-2.5V8.25h9.5ZM11.25 10a0.75.75 0 0 0-1.5 0v5.25a0.75.75 0 0 0 1.5 0V10Zm3 0a0.75.75 0 0 0-1.5 0v5.25a0.75.75 0 0 0 1.5 0V10Z"
      fill="currentColor"
    />
  </svg>
);

type CartItem = {
  product: Product;
  quantity: number;
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<SectorFilter>("Todos");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [source, setSource] = useState<"api" | "mock">("mock");
  const [feed, setFeed] = useState<ProductsFeed | null>(null);
  const [pagination, setPagination] = useState<ProductsPagination>({
    limit: 50,
    offset: 0,
    hasMore: false,
    nextOffset: 0
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [route, setRoute] = useState<Route>("catalogo");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isZoomImageOpen, setIsZoomImageOpen] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutForm>(initialCheckoutForm);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "success">("details");

  const rawCategoryStableRef = useRef<Map<string, string>>(new Map());

  const persistRawCategoriesFromProducts = useCallback((list: Product[]) => {
    const groups = new Map<string, string[]>();
    for (const product of list) {
      if (!product.rawCategory) continue;
      const key = normalizeCategoryKey(product.category);
      if (!groups.has(key)) groups.set(key, []);
      const arr = groups.get(key)!;
      if (!arr.includes(product.rawCategory)) arr.push(product.rawCategory);
    }

    for (const product of list) {
      if (rawCategoryStableRef.current.has(product.category)) continue;
      const key = normalizeCategoryKey(product.category);
      const candidates = groups.get(key) ?? [];
      if (!candidates.length) continue;
      const sorted = [...candidates].sort((a, b) => {
        const base = a.localeCompare(b, "pt-BR", { sensitivity: "base" });
        if (base !== 0) return base;
        return a.length - b.length;
      });
      rawCategoryStableRef.current.set(product.category, sorted[0]);
    }
  }, []);

  useEffect(() => {
    persistRawCategoriesFromProducts(products);
  }, [products, persistRawCategoriesFromProducts]);

  const findRawCategoryStable = useCallback((displayCategory: string) => {
    const exact = rawCategoryStableRef.current.get(displayCategory);
    if (exact) return exact;
    const entries = Array.from(rawCategoryStableRef.current.entries());
    const matched = entries.find(([display]) => sameCategoryFuzzy(display, displayCategory));
    return matched ? matched[1] : undefined;
  }, []);

  const appendFeed = useCallback((next: ProductsFeed) => {
    setFeed(next);
    setPagination(next.pagination);
    setSource(next.source);
    persistRawCategoriesFromProducts(next.products);

    if (next.pagination.offset === 0) {
      setProducts(next.products);
      return;
    }

    setProducts((previousProducts) => {
      const seen = new Set(previousProducts.map(p => p.id));
      const extras = next.products.filter((product) => !seen.has(product.id));
      return [...previousProducts, ...extras];
    });
  }, [persistRawCategoriesFromProducts]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const activeSectorForApi = useMemo(() => {
    if (selectedSector === "Todos") {
      return { genero: undefined, infantil: undefined };
    }
    if (selectedSector === "Infantil") {
      return { genero: undefined, infantil: "true" };
    }
    return { genero: selectedSector.toLowerCase(), infantil: undefined };
  }, [selectedSector]);

  const activeCategoryForApi = useMemo(() => {
    if (selectedCategory === "Todos" || selectedCategory === SPECIAL_CATEGORIES.Novidades) {
      return undefined;
    }
    const raw = findRawCategoryStable(selectedCategory);
    return raw ?? selectedCategory;
  }, [selectedCategory, findRawCategoryStable]);

  const fetchCountRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      fetchCountRef.current += 1;
      const fetchId = fetchCountRef.current;
      const startedAt = new Date();

      const clicked = { sector: selectedSector, category: selectedCategory };
      const sent = {
        categoria: activeCategoryForApi ?? null,
        genero: activeSectorForApi.genero ?? null,
        infantil: activeSectorForApi.infantil ?? null,
        offset: pagination.offset,
        limit: pagination.limit,
        q: debouncedQuery || null
      };

      console.groupCollapsed(
        `[BrechoWeb] Fetch #${fetchId} · [${clicked.sector}] ${clicked.category} · offset=${sent.offset}`
      );
      console.time(`[BrechoWeb] Fetch #${fetchId} duration`);
      console.log("🖱️  Clicado (seleção do usuário):", clicked);
      console.log("📤 Enviado para API:", sent);

      if (pagination.offset === 0) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const result = await getProducts(
          {
            limit: pagination.limit,
            offset: pagination.offset,
            q: debouncedQuery || undefined,
            categoria: activeCategoryForApi,
            genero: activeSectorForApi.genero,
            infantil: activeSectorForApi.infantil
          },
          controller.signal
        );

        if (controller.signal.aborted) {
          console.warn("⛔ Request abortada (dispatch de outra requisição).");
          console.timeEnd(`[BrechoWeb] Fetch #${fetchId} duration`);
          console.groupEnd();
          return;
        }

        appendFeed(result);

        const finishedAt = new Date();
        const durationMs = Number(finishedAt) - Number(startedAt);
        const uniqDisplay = Array.from(new Set(result.products.map(p => p.category))).slice(0, 10);
        const uniqRaw = Array.from(new Set(result.products.map(p => p.rawCategory).filter(Boolean) as string[])).slice(0, 10);

        console.log(
          `✅ Status=200 · source=${result.source} · retornadas=${result.products.length} peças · ${durationMs}ms`
        );
        console.log("🧾 Categorias (display) no retorno:", uniqDisplay);
        console.log("🧾 Categorias (raw/DB)    no retorno:", uniqRaw);
        if (result.products.length > 0) {
          console.log(
            "🔬 Exemplo de peça [0]: display=",
            result.products[0].category,
            " · raw=",
            result.products[0].rawCategory ?? "—",
            " · name=",
            result.products[0].name
          );
        }
        console.timeEnd(`[BrechoWeb] Fetch #${fetchId} duration`);
        console.groupEnd();
      } catch (error) {
        if (controller.signal.aborted) {
          console.warn("⛔ Request abortada (dispatch de outra requisição).");
          console.timeEnd(`[BrechoWeb] Fetch #${fetchId} duration`);
          console.groupEnd();
          return;
        }
        const finishedAt = new Date();
        const durationMs = Number(finishedAt) - Number(startedAt);
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Erro na requisição (${durationMs}ms):`, message);
        console.timeEnd(`[BrechoWeb] Fetch #${fetchId} duration`);
        console.groupEnd();
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false);
          setIsLoadingMore(false);
        }
      }
    };

    void loadProducts();

    return () => controller.abort();
  }, [debouncedQuery, activeCategoryForApi, activeSectorForApi, pagination.limit, pagination.offset, appendFeed, selectedCategory, selectedSector]);

  useEffect(() => {
    setProducts([]);
    setPagination(previous => ({ ...previous, offset: 0, hasMore: false, nextOffset: 0 }));
  }, [debouncedQuery, activeCategoryForApi, activeSectorForApi, pagination.limit]);

  const filteredProducts = useMemo(() => {
    const now = new Date();
    const isNovidades = selectedCategory === SPECIAL_CATEGORIES.Novidades;
    const normalizedQuery = normalizeForSearch(debouncedQuery);
    const normalizedSector = selectedSector === "Todos" ? null : selectedSector;

    const base = products.filter(product => {
      const matchesSector = !normalizedSector || product.sector === normalizedSector;

      const matchesCategory =
        selectedCategory === "Todos"
          ? true
          : isNovidades
            ? isNewlyReleased(product.createdAt, now)
            : sameCategoryFuzzy(product.category, selectedCategory);

      let matchesQuery = true;
      if (normalizedQuery) {
        const haystack = normalizeForSearch(
          `${product.name} ${product.description} ${product.category} ${product.size} ${product.id}`
        );
        matchesQuery = haystack.includes(normalizedQuery);
      }

      return matchesSector && matchesCategory && matchesQuery;
    });

    if (isNovidades) {
      return base
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return base;
  }, [products, debouncedQuery, selectedCategory, selectedSector]);

  const isAnyDrawerOpen = isMenuOpen || isCartOpen;
  const isProductModalOpen = Boolean(selectedProduct);
  const isAnyOverlayOpen = isAnyDrawerOpen || isProductModalOpen || isZoomImageOpen;

  useEffect(() => {
    if (!isProductModalOpen) {
      return;
    }

    const rafId = requestAnimationFrame(() => {
      const wraps = document.querySelectorAll<HTMLDivElement>(
        ".related-scroll-wrap"
      );
      wraps.forEach((wrap) => {
        const carousel = wrap.querySelector<HTMLDivElement>(".mini-carousel");
        if (!carousel) {
          return;
        }

        const overflow = carousel.scrollWidth - 1 > carousel.clientWidth;
        wrap.classList.toggle("is-scrollable", overflow);
        carousel.scrollTo({ left: 0 });
      });
    });

    const handleResize = () => {
      const wraps = document.querySelectorAll<HTMLDivElement>(
        ".related-scroll-wrap"
      );
      wraps.forEach((wrap) => {
        const carousel = wrap.querySelector<HTMLDivElement>(".mini-carousel");
        if (!carousel) {
          return;
        }

        const overflow = carousel.scrollWidth - 1 > carousel.clientWidth;
        wrap.classList.toggle("is-scrollable", overflow);
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isProductModalOpen, selectedProduct?.id]);

  useEffect(() => {
    document.body.style.overflow = isAnyOverlayOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyOverlayOpen]);

  useEffect(() => {
    if (!isAnyOverlayOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsZoomImageOpen(false);
        setIsMenuOpen(false);
        setIsCartOpen(false);
        setSelectedProduct(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnyOverlayOpen]);

  useEffect(() => {
    if (source === "mock" && import.meta.env.DEV) {
      console.info(
        "BrechoWeb: usando catalogo de demonstracao. Defina VITE_API_URL para conectar a API real."
      );
    }
  }, [source]);

  const sectorCategoryGroups = useMemo(() => {
    const groups = getSectorsAndCategoriesFromProducts(products);
    return groups.sectorCategories;
  }, [products]);

  const availableSectors = useMemo(() => {
    return SECTORS.filter((sector) => sectorCategoryGroups[sector]?.length > 0);
  }, [sectorCategoryGroups]);

  const sectorFilterOptions = useMemo<SectorFilter[]>(() => {
    if (availableSectors.length === 0) {
      return ["Todos"];
    }
    return ["Todos", ...availableSectors];
  }, [availableSectors]);

  const hasAnyNewProduct = useMemo(() => {
    const now = new Date();
    return products.some((product) => isNewlyReleased(product.createdAt, now));
  }, [products]);

  useEffect(() => {
    if (products.length === 0 || isInitialLoading || isLoadingMore) {
      return;
    }
    if (selectedSector !== "Todos" && !availableSectors.includes(selectedSector as Sector)) {
      setSelectedSector("Todos");
      setSelectedCategory("Todos");
    }
  }, [availableSectors, selectedSector, products, isInitialLoading, isLoadingMore]);

  useEffect(() => {
    if (products.length === 0 || isInitialLoading || isLoadingMore) {
      return;
    }
    const isCategorySpecial = selectedCategory === SPECIAL_CATEGORIES.Novidades;
    if (isCategorySpecial && !hasAnyNewProduct) {
      setSelectedCategory("Todos");
      return;
    }
    if (!isCategorySpecial && selectedCategory !== "Todos") {
      const allowed =
        selectedSector === "Todos"
          ? getSectorsAndCategoriesFromProducts(products).allCategories
          : sectorCategoryGroups[selectedSector as Sector] ?? [];
      const matched = findCategoryFuzzy(allowed, selectedCategory);
      if (!matched) {
        setSelectedCategory("Todos");
      }
    }
  }, [products, selectedSector, selectedCategory, sectorCategoryGroups, hasAnyNewProduct, isInitialLoading, isLoadingMore]);






  const categories = useMemo(() => {
    const groups = getSectorsAndCategoriesFromProducts(products);
    const realCategories =
      selectedSector === "Todos"
        ? groups.allCategories
        : groups.sectorCategories[selectedSector] ?? [];

    const base = ["Todos", ...realCategories];
    if (hasAnyNewProduct) {
      base.splice(1, 0, SPECIAL_CATEGORIES.Novidades);
    }
    return base;
  }, [products, selectedSector, hasAnyNewProduct]);

  const canLoadMore =
    pagination.hasMore &&
    !isInitialLoading &&
    !isLoadingMore &&
    selectedCategory !== SPECIAL_CATEGORIES.Novidades &&
    !debouncedQuery;

  const handleLoadMore = () => {
    if (!canLoadMore) return;
    setPagination(previous => ({ ...previous, offset: previous.nextOffset }));
  };

  const cartSummary = useMemo(() => {
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    return { count, subtotal };
  }, [cartItems]);

  const usingFallback = source === "mock";

  const handleAddToCart = (product: Product) => {
    setCartItems((currentItems) => {
      const existingIndex = currentItems.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const nextItems = currentItems.slice();
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + 1
        };
        return nextItems;
      }

      return [...currentItems, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const changeItemQuantity = (productId: string, direction: "increase" | "decrease") => {
    setCartItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          const nextQuantity =
            direction === "increase" ? item.quantity + 1 : item.quantity - 1;

          if (nextQuantity <= 0) {
            return null;
          }

          return { ...item, quantity: nextQuantity };
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    const sameCategory = products.filter(
      (product) =>
        product.id !== selectedProduct.id &&
        product.category === selectedProduct.category
    );

    if (sameCategory.length >= 6) {
      return sameCategory.slice(0, 8);
    }

    const sameSector = products.filter(
      (product) =>
        product.id !== selectedProduct.id &&
        product.sector === selectedProduct.sector &&
        !sameCategory.some((item) => item.id === product.id)
    );

    return [...sameCategory, ...sameSector].slice(0, 8);
  }, [selectedProduct, products]);

  const handleAddToCartFromModal = (product: Product) => {
    handleAddToCart(product);
    setSelectedProduct(null);
  };

  const navigate = (nextRoute: Route) => {
    setRoute(nextRoute);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToSector = (sector: SectorFilter) => {
    setRoute("catalogo");
    setSelectedSector(sector);
    setSelectedCategory("Todos");
    setQuery("");
    setDebouncedQuery("");
    setPagination(previous => ({ ...previous, offset: 0 }));
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToCategory = (
    sector: SectorFilter,
    category: string
  ) => {
    setRoute("catalogo");
    setSelectedSector(sector);
    setSelectedCategory(category);
    setQuery("");
    setDebouncedQuery("");
    setPagination(previous => ({ ...previous, offset: 0 }));
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToCatalogo = () => navigateToSector("Todos");

  const goToCheckout = () => {
    setIsCartOpen(false);
    setCheckoutStep("details");
    navigate("checkout");
  };

  const routeInfo =
    route === "checkout"
      ? { key: "checkout" as Route, label: "Finalizar pedido" }
      : ROUTES.find((item) => item.key === route);

  return (
    <div className="app-shell">
      <div className="ambient ambient--left" />
      <div className="ambient ambient--right" />

      <header className="topbar">
        <button
          type="button"
          className="brand brand--clickable"
          onClick={goToCatalogo}
          aria-label="Ir para a pagina inicial"
        >
          <span className="brand__mark">BW</span>
          <strong>BrechoWeb</strong>
        </button>

        <div className="topbar__actions">
          <a className="icon-button" href="#busca" aria-label="Buscar produtos">
            <SearchIcon />
          </a>
          <button
            type="button"
            className="icon-button icon-button--cart"
            aria-label="Carrinho"
            aria-expanded={isCartOpen}
            aria-controls="carrinho-lateral"
            onClick={() => setIsCartOpen((current) => !current)}
          >
            <CartIcon />
            {cartSummary.count ? (
              <span className="cart-count">{cartSummary.count}</span>
            ) : null}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-expanded={isMenuOpen}
            aria-controls="menu-lateral"
            aria-label="Abrir menu"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {usingFallback && import.meta.env.DEV ? (
        <div className="dev-hint">Modo demonstracao ativo</div>
      ) : null}

      <div
        className={isAnyDrawerOpen ? "menu-overlay menu-overlay--open" : "menu-overlay"}
        onClick={() => {
          setIsMenuOpen(false);
          setIsCartOpen(false);
        }}
      />

      <aside
        id="menu-lateral"
        className={isMenuOpen ? "side-menu side-menu--open" : "side-menu"}
        aria-hidden={!isMenuOpen}
      >
        <div className="side-menu__header">
          <div className="brand">
            <span className="brand__mark">BW</span>
            <strong>BrechoWeb</strong>
          </div>
          <button
            type="button"
            className="side-menu__close"
            aria-label="Fechar menu"
            onClick={() => setIsMenuOpen(false)}
          >
            Fechar
          </button>
        </div>

        <nav className="side-menu__nav" aria-label="Paginas">
          <section className="menu-section menu-section--compact">
            <div className="menu-section__list">
              <button
                type="button"
                className={
                  route === "catalogo" &&
                  selectedCategory === SPECIAL_CATEGORIES.Novidades
                    ? "side-menu__nav-button is-highlight is-active"
                    : "side-menu__nav-button is-highlight"
                }
                onClick={() =>
                  navigateToCategory("Todos", SPECIAL_CATEGORIES.Novidades)
                }
              >
                <span className="side-menu__nav-button-label">
                  <span className="spark" aria-hidden="true">●</span>
                  Novidades
                </span>
              </button>
            </div>
          </section>

          <div className="menu-divider" aria-hidden="true" />

          <section className="menu-section">
            <div className="menu-section__header">
              <span className="eyebrow eyebrow--muted">Catalogo</span>
              <button
                type="button"
                className={
                  route === "catalogo" &&
                  selectedSector === "Todos" &&
                  selectedCategory === "Todos"
                    ? "menu-section__title is-active"
                    : "menu-section__title"
                }
                onClick={() => navigateToSector("Todos")}
              >
                Produtos
              </button>
            </div>

            <div className="sector-list" role="tablist" aria-label="Setores">
              {SECTORS.filter((sector) => availableSectors.includes(sector)).map((sector) => {
                const hasCategories = sectorCategoryGroups[sector].length > 0;
                const isSectorActive =
                  route === "catalogo" &&
                  selectedSector === sector &&
                  selectedCategory === "Todos";

                return (
                  <div
                    key={sector}
                    className={
                      route === "catalogo" && selectedSector === sector
                        ? "sector-card sector-card--active"
                        : "sector-card"
                    }
                  >
                    <div className="sector-card__header">
                      <button
                        type="button"
                        className={
                          isSectorActive
                            ? "sector-card__title sector-card__title--active"
                            : "sector-card__title"
                        }
                        onClick={() => navigateToSector(sector)}
                        disabled={!hasCategories}
                      >
                        {sector}
                      </button>
                    </div>

                    {hasCategories ? (
                      <div
                        className="category-grid category-grid--compact"
                        role="tablist"
                        aria-label={`Subgrupos de ${sector}`}
                      >
                        {sectorCategoryGroups[sector].map((category) => {
                          const isActive =
                            route === "catalogo" &&
                            selectedSector === sector &&
                            selectedCategory === category;

                          return (
                            <button
                              key={`${sector}-${category}`}
                              type="button"
                              className={
                                isActive
                                  ? "category-chip category-chip--active"
                                  : "category-chip"
                              }
                              onClick={() => navigateToCategory(sector, category)}
                            >
                              {category}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="sector-card__empty">
                        Sem subgrupos para este setor no momento.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="menu-divider" aria-hidden="true" />

          <section className="menu-section">
            <div className="menu-section__header">
              <span className="eyebrow eyebrow--muted">Institucional</span>
              <strong className="menu-section__title menu-section__title--static">
                Outras paginas
              </strong>
            </div>

            <div className="menu-section__list">
              {ROUTES.filter((item) => item.key !== "catalogo").map((item) => {
                const isActive = item.key === route;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={
                      isActive
                        ? "side-menu__nav-button is-active"
                        : "side-menu__nav-button"
                    }
                    onClick={() => navigate(item.key)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
        </nav>

        <div className="side-menu__content">
          <span className="eyebrow eyebrow--muted">Atalhos</span>
          <p>
            Escolha um setor para ir direto ao grupo de produtos ou entre em um subgrupo de tipo de
            roupa e ja chegue na vitrine filtrada.
          </p>
        </div>
      </aside>

      <aside
        id="carrinho-lateral"
        className={isCartOpen ? "cart-drawer cart-drawer--open" : "cart-drawer"}
        aria-hidden={!isCartOpen}
      >
        <div className="cart-drawer__header">
          <div>
            <span className="eyebrow eyebrow--muted">Carrinho</span>
            <strong>
              {cartSummary.count
                ? `${cartSummary.count} ${cartSummary.count === 1 ? "item" : "itens"}`
                : "Nenhum item adicionado"}
            </strong>
          </div>
          <button
            type="button"
            className="side-menu__close"
            aria-label="Fechar carrinho"
            onClick={() => setIsCartOpen(false)}
          >
            Fechar
          </button>
        </div>

        {cartItems.length ? (
          <div className="cart-drawer__content">
            <div className="cart-list">
              {cartItems.map((item) => (
                <article className="cart-item" key={item.product.id}>
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="cart-item__info">
                    <div className="cart-item__header">
                      <div>
                        <strong>{item.product.name}</strong>
                        <span>{item.product.category} · {item.product.size}</span>
                      </div>
                      <button
                        type="button"
                        className="cart-item__remove"
                        aria-label={`Remover ${item.product.name} do carrinho`}
                        onClick={() => removeItem(item.product.id)}
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    <div className="cart-item__row">
                      <div className="cart-item__qty">
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item.product.id, "decrease")}
                          aria-label="Diminuir quantidade"
                        >
                          <MinusIcon />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeItemQuantity(item.product.id, "increase")}
                          aria-label="Aumentar quantidade"
                        >
                          <PlusIcon />
                        </button>
                      </div>
                      <strong className="cart-item__price">
                        {priceFormatter.format(item.product.price * item.quantity)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-summary__line">
                <span>Subtotal</span>
                <strong>{priceFormatter.format(cartSummary.subtotal)}</strong>
              </div>
              <div className="cart-summary__line cart-summary__line--muted">
                <span>Entrega</span>
                <strong>A definir</strong>
              </div>
              <div className="cart-summary__line cart-summary__line--total">
                <span>Total estimado</span>
                <strong>{priceFormatter.format(cartSummary.subtotal)}</strong>
              </div>

              <div className="cart-summary__actions">
                <button type="button" className="button" onClick={goToCheckout}>
                  Finalizar pedido
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => {
                    clearCart();
                    setIsCartOpen(false);
                  }}
                >
                  Limpar carrinho
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="cart-drawer__empty">
            <h3>Seu carrinho esta vazio</h3>
            <p>
              Volte ao catalogo, descubra as pecas que voce gosta e adicione aqui antes de
              finalizar.
            </p>
            <button
              type="button"
              className="button"
              onClick={() => {
                setIsCartOpen(false);
                goToCatalogo();
              }}
            >
              Ver produtos
            </button>
          </div>
        )}
      </aside>

      <main className="layout">
        {route === "catalogo" ? (
          <section className="catalogo" id="catalogo">
            <div className="section-heading">
              <div>
                <span className="eyebrow eyebrow--muted">
                  {selectedSector === "Todos" ? "Catalogo" : selectedSector}
                </span>
                <h1>
                  {selectedSector === "Todos"
                    ? "Produtos selecionados"
                    : `${selectedSector} · ${
                        selectedCategory === "Todos" ? "todos os tipos" : selectedCategory
                      }`}
                </h1>
              </div>
              <p>
                Explore, filtre e encontre rapidamente as pecas que mais combinam com o seu estilo.
              </p>
            </div>

            <div className="toolbar" id="busca">
              <label className="search-field">
                <span className="search-field__icon">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  placeholder="Buscar produtos"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <div className="chips chips--sector" role="tablist" aria-label="Setores">
                {sectorFilterOptions.map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    className={sector === selectedSector ? "chip chip--active" : "chip"}
                    onClick={() => {
                      setSelectedSector(sector);
                      setSelectedCategory("Todos");
                      setPagination(previous => ({ ...previous, offset: 0 }));
                    }}
                  >
                    {sector}
                  </button>
                ))}
              </div>

              <div className="chips" role="tablist" aria-label="Categorias">
                {categories.map((category) => {
                  const isSpecial = category === SPECIAL_CATEGORIES.Novidades;
                  const isActive = category === selectedCategory;

                  return (
                    <button
                      key={category}
                      type="button"
                      className={[
                        isSpecial ? "chip chip--special" : "chip",
                        isActive ? "chip--active" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        setSelectedCategory(category);
                        setPagination(previous => ({ ...previous, offset: 0 }));
                      }}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {isInitialLoading ? (
              <div className="product-grid product-grid--two">
                {Array.from({ length: 6 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : filteredProducts.length ? (
              <>
                <div className="product-grid product-grid--two">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onOpenDetails={(nextProduct) => setSelectedProduct(nextProduct)}
                    />
                  ))}
                </div>

                <div className="catalogo-pagination" aria-label="Paginacao do catalogo">
                  {isLoadingMore ? (
                    <div className="product-grid product-grid--two" aria-label="Carregando mais pecas">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <ProductSkeleton key={`loadmore-${index}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="pagination">
                      {canLoadMore ? (
                        <button
                          type="button"
                          className="button pagination__load-more"
                          onClick={handleLoadMore}
                        >
                          Carregar mais
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>Nenhuma peca encontrada</h3>
                <p>Ajuste sua busca ou selecione outra categoria para continuar explorando.</p>
              </div>
            )}
          </section>
        ) : null}

        {route === "sobre" ? (
          <section className="about-page" aria-labelledby="about-title">
            <PageHeader
              eyebrow="Marca"
              title={routeInfo?.label ?? "Sobre o BrechoWeb"}
              description="Renovar o guarda-roupa com pecas cheias de personalidade, sem abrir mao do seu estilo e de um jeito mais consciente."
              onBack={goToCatalogo}
            />

            <article className="surface-card surface-card--intro about-intro">
              <span className="surface-card__tag">Marca</span>
              <h2 id="about-title" className="surface-card__title">
                Um novo jeito de renovar o guarda-roupa com muito estilo.
              </h2>
              <p className="surface-card__lead">
                Aqui voce encontra pecas curadas, cheias de personalidade e prontas para
                entrar no seu dia a dia. O BrechoWeb foi feito para quem ama se vestir bem
                sem abrir mao de escolhas mais conscientes.
              </p>

              <figure className="about-image" aria-hidden="true">
                <img
                  src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=editorial%20fashion%20detail%20minimalist%20lifestyle%20clothes%20rack%20hanger%20wooden%20beige%20cream%20soft%20light%20neutral%20aesthetic%20clean%20bright%20air&image_size=landscape_16_9"
                  alt="Detalhe de pecas de roupa em cabideiro, editorial de moda minimalista"
                  loading="eager"
                  decoding="async"
                />
              </figure>

              <div className="about-intro__body">
                <p>
                  Sabemos que montar um guarda-roupa que parece com voce vai muito alem de
                  pecas novas. E sobre encontrar itens com historia, caimentos que valorizam
                  seu corpo e combinações que fazem voce se sentir bem todos os dias.
                </p>
                <p>
                  Por isso cada peca aqui passa por uma curadoria atenta: tecidos, cortes,
                  estampas e tons que se encaixam em diferentes estilos, do basico bem
                  feito as assinaturas mais marcantes. Tudo pronto para voce descobrir
                  novas formas de se vestir.
                </p>
              </div>

              <div className="about-intro__actions">
                <button type="button" className="button" onClick={goToCatalogo}>
                  Renovar meu guarda-roupa
                </button>
              </div>
            </article>

            <section className="about-positioning" aria-labelledby="positioning-title">
              <header className="about-positioning__header">
                <span className="surface-card__tag">Como a marca se posiciona</span>
                <h2 id="positioning-title" className="surface-card__title">
                  Quatro pilares que definem o nosso jeito de vestir.
                </h2>
                <p className="surface-card__lead">
                  Do basico ao mais autoral, tudo e pensado para voce montar looks
                  criativos, confortaveis e cheios de personalidade no dia a dia.
                </p>
              </header>

              <div className="pillars-grid" role="list">
                <article className="surface-card pillar-card" role="listitem">
                  <h3 className="pillar-card__title">Atual</h3>
                  <p className="pillar-card__text">
                    Pecas que dialogam com as tendencias de hoje, mas com pegada atemporal
                    para durar muito tempo no seu guarda-roupa.
                  </p>
                </article>

                <article className="surface-card pillar-card" role="listitem">
                  <h3 className="pillar-card__title">Curadoria</h3>
                  <p className="pillar-card__text">
                    Cada item e escolhido com cuidado: qualidade, estado de conservacao e
                    potencial de combinacao com outras pecas.
                  </p>
                </article>

                <article className="surface-card pillar-card" role="listitem">
                  <h3 className="pillar-card__title">Sustentavel</h3>
                  <p className="pillar-card__text">
                    Moda pre-loved que ganha nova vida. Um jeito consciente de consumir,
                    recontar historias e montar looks originais.
                  </p>
                </article>

                <article className="surface-card pillar-card" role="listitem">
                  <h3 className="pillar-card__title">Acessivel</h3>
                  <p className="pillar-card__text">
                    Estilo que cabe no bolso e em diferentes momentos. Encontre pecas
                    versateis para trabalho, lazer e ocasoes especiais.
                  </p>
                </article>
              </div>
            </section>

            <article className="surface-card surface-card--cta about-cta">
              <div>
                <span className="surface-card__tag">Contato</span>
                <h2 className="surface-card__title">
                  Quer montar um guarda-roupa alinhado ao seu estilo?
                </h2>
                <p className="surface-card__lead">
                  Fale com nosso time para conhecer novas entradas, pedir dicas de
                  combinacoes ou acompanhar de perto as pecas que mais combinam com voce.
                </p>
              </div>

              <a className="button" href="mailto:contato@brechoweb.local">
                Falar com o time
              </a>
            </article>
          </section>
        ) : null}

        {route === "checkout" ? (
          <section className="checkout-page" aria-labelledby="checkout-title">
            <PageHeader
              eyebrow="Pedido"
              title={routeInfo?.label ?? "Finalizar pedido"}
              description="Revise suas pecas, confira seus dados e conclua a reserva do seu pedido."
              onBack={cartItems.length ? goToCatalogo : goToCatalogo}
            />

            {checkoutStep === "success" ? (
              <article className="surface-card checkout-success" aria-live="polite">
                <span className="surface-card__tag">Pedido confirmado</span>
                <h2 className="surface-card__title">Obrigado! Seu pedido foi reservado.</h2>
                <p className="surface-card__lead">
                  Entraremos em contato em breve no WhatsApp ou por e-mail para confirmar os
                  detalhes da entrega e combinar a forma de pagamento.
                </p>

                <div className="checkout-success__summary">
                  <div>
                    <span className="muted-label">Nome</span>
                    <strong>{checkout.fullName || "—"}</strong>
                  </div>
                  <div>
                    <span className="muted-label">Contato</span>
                    <strong>{checkout.phone || "—"}</strong>
                  </div>
                  <div>
                    <span className="muted-label">Itens</span>
                    <strong>{cartSummary.count} peca{cartSummary.count === 1 ? "" : "s"}</strong>
                  </div>
                  <div>
                    <span className="muted-label">Total</span>
                    <strong className="price-strong">
                      {priceFormatter.format(cartSummary.subtotal)}
                    </strong>
                  </div>
                </div>

                <div className="checkout-success__actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      clearCart();
                      setCheckout(initialCheckoutForm);
                      goToCatalogo();
                    }}
                  >
                    Voltar para o catalogo
                  </button>
                </div>
              </article>
            ) : cartItems.length === 0 ? (
              <article className="surface-card checkout-empty">
                <span className="surface-card__tag">Carrinho vazio</span>
                <h2 className="surface-card__title">Nenhuma peca selecionada ainda.</h2>
                <p className="surface-card__lead">
                  Volte ao catalogo e escolha suas pecas favoritas antes de finalizar.
                </p>
                <div className="checkout-empty__actions">
                  <button type="button" className="button" onClick={goToCatalogo}>
                    Explorar o catalogo
                  </button>
                </div>
              </article>
            ) : (
              <div className="checkout-grid">
                <div className="checkout-form" role="form" aria-label="Dados do pedido">
                  <article className="surface-card checkout-block">
                    <span className="surface-card__tag">1. Seus dados</span>
                    <h2 className="surface-card__title">Para quem vamos reservar suas pecas?</h2>

                    <div className="checkout-field-grid">
                      <label className="checkout-field checkout-field--full">
                        <span>Nome completo</span>
                        <input
                          type="text"
                          autoComplete="name"
                          placeholder="Ex.: Maria Silva"
                          value={checkout.fullName}
                          onChange={(event) =>
                            setCheckout({ ...checkout, fullName: event.target.value })
                          }
                        />
                      </label>

                      <label className="checkout-field">
                        <span>WhatsApp</span>
                        <input
                          type="tel"
                          autoComplete="tel"
                          placeholder="(11) 98765-4321"
                          value={checkout.phone}
                          onChange={(event) =>
                            setCheckout({
                              ...checkout,
                              phone: phoneMask(event.target.value)
                            })
                          }
                        />
                      </label>

                      <label className="checkout-field">
                        <span>CPF</span>
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="000.000.000-00"
                          value={checkout.cpf}
                          onChange={(event) =>
                            setCheckout({
                              ...checkout,
                              cpf: cpfMask(event.target.value)
                            })
                          }
                        />
                      </label>
                    </div>
                  </article>

                  <article className="surface-card checkout-block">
                    <span className="surface-card__tag">3. Pagamento</span>
                    <h2 className="surface-card__title">Como voce prefere pagar?</h2>
                    <p className="surface-card__lead">
                      Apos confirmar, combinamos o pagamento direto por WhatsApp ou e-mail.
                    </p>

                    <div className="checkout-payment" role="radiogroup" aria-label="Forma de pagamento">
                      {(
                        [
                          {
                            key: "pix" as PaymentMethod,
                            label: "Pix",
                            hint: "Pagamento instantaneo, confirmamos na hora."
                          },
                          {
                            key: "card" as PaymentMethod,
                            label: "Cartao",
                            hint: "Link de pagamento enviado apos confirmar."
                          },
                          {
                            key: "boleto" as PaymentMethod,
                            label: "Boleto",
                            hint: "Boleto enviado por WhatsApp ou e-mail."
                          }
                        ]
                      ).map((method) => {
                        const selected = checkout.payment === method.key;
                        return (
                          <label
                            key={method.key}
                            className={
                              selected
                                ? "checkout-payment__item checkout-payment__item--selected"
                                : "checkout-payment__item"
                            }
                          >
                            <input
                              type="radio"
                              name="payment-method"
                              value={method.key}
                              checked={selected}
                              onChange={() =>
                                setCheckout({ ...checkout, payment: method.key })
                              }
                            />
                            <div>
                              <strong>{method.label}</strong>
                              <span>{method.hint}</span>
                            </div>
                            <span
                              className={
                                selected
                                  ? "checkout-payment__radio checkout-payment__radio--on"
                                  : "checkout-payment__radio"
                              }
                              aria-hidden="true"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </article>
                </div>

                <aside className="checkout-summary">
                  <article className="surface-card">
                    <span className="surface-card__tag">Resumo do pedido</span>
                    <h2 className="surface-card__title">
                      {cartSummary.count} peca{cartSummary.count === 1 ? "" : "s"} selecionada
                      {cartSummary.count === 1 ? "" : "s"}
                    </h2>

                    <div className="checkout-items">
                      {cartItems.map((item) => (
                        <article key={item.product.id} className="checkout-item">
                          <div className="checkout-item__media">
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <div className="checkout-item__meta">
                            <h3>{item.product.name}</h3>
                            <span>
                              {item.product.sector} · {item.product.category} · Tam.{" "}
                              {item.product.size}
                            </span>
                            <strong>
                              {priceFormatter.format(item.product.price)}
                            </strong>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="checkout-summary__lines">
                      <div className="checkout-summary__line">
                        <span>Subtotal</span>
                        <strong>{priceFormatter.format(cartSummary.subtotal)}</strong>
                      </div>
                      <div className="checkout-summary__line checkout-summary__line--muted">
                        <span>Entrega</span>
                        <strong>A confirmar</strong>
                      </div>
                      <div className="checkout-summary__line checkout-summary__line--total">
                        <span>Total</span>
                        <strong>{priceFormatter.format(cartSummary.subtotal)}</strong>
                      </div>
                    </div>

                    <div className="checkout-summary__actions">
                      <button
                        type="button"
                        className="button button--block"
                        onClick={() => setCheckoutStep("success")}
                      >
                        Confirmar pedido
                      </button>
                      <button
                        type="button"
                        className="button button--secondary button--block"
                        onClick={goToCatalogo}
                      >
                        Continuar comprando
                      </button>
                    </div>
                  </article>
                </aside>
              </div>
            )}
          </section>
        ) : null}
      </main>

      {selectedProduct ? (
        <div
          className="product-modal-overlay"
          role="presentation"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="product-modal__screen-header">
              <button
                type="button"
                className="product-modal__back"
                onClick={() => setSelectedProduct(null)}
                aria-label="Voltar para o catalogo"
              >
                <ArrowLeftIcon />
                Voltar
              </button>

              <div className="product-modal__screen-title">
                <span className="eyebrow eyebrow--muted">Detalhe do produto</span>
                <strong>{selectedProduct.category}</strong>
              </div>

              <div className="product-modal__actions">
                <button
                  type="button"
                  className="icon-button icon-button--ghost"
                  aria-label="Compartilhar produto"
                >
                  <ShareIcon />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button--ghost"
                  aria-label="Fechar detalhe do produto"
                  onClick={() => setSelectedProduct(null)}
                >
                  <CloseIcon />
                </button>
              </div>
            </header>

            <div className="product-modal__tags product-modal__tags--inline">
              {selectedProduct.isKids ?? selectedProduct.sector === "Infantil" ? (
                <span className="badge badge--kids">Infantil</span>
              ) : null}
              {selectedProduct.isNew ? (
                <span className="badge badge--accent">Novo</span>
              ) : null}
            </div>

            <div className="product-modal__body">
              <div className="product-modal__media">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <HangerPlaceholder
                    title={selectedProduct.category || selectedProduct.sector}
                    subtitle={selectedProduct.size && selectedProduct.size !== "Unico" ? selectedProduct.size : undefined}
                  />
                )}
                {selectedProduct.imageUrl ? (
                  <button
                    type="button"
                    className="product-modal__media-button"
                    aria-label="Ampliar imagem"
                    title="Clique para ampliar a imagem"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsZoomImageOpen(true);
                    }}
                  />
                ) : null}
                {selectedProduct.imageUrl ? (
                  <span className="product-modal__zoom-hint">
                    <ZoomInIcon /> Ampliar
                  </span>
                ) : null}
              </div>

              <div className="product-modal__info">
                <div className="product-modal__summary">
                  <h2 id="product-modal-title" className="product-modal__title">
                    {selectedProduct.name}
                  </h2>
                  <strong className="product-modal__price">
                    {priceFormatter.format(selectedProduct.price)}
                  </strong>
                </div>

                <dl className="product-modal__specs">
                  <div>
                    <dt>Categoria</dt>
                    <dd>{selectedProduct.category}</dd>
                  </div>
                  <div>
                    <dt>Marca</dt>
                    <dd>{selectedProduct.brand || "Nao informado"}</dd>
                  </div>
                  <div>
                    <dt>Tamanho</dt>
                    <dd>{selectedProduct.size}</dd>
                  </div>
                  <div>
                    <dt>Cor</dt>
                    <dd>{selectedProduct.color || "Nao informada"}</dd>
                  </div>
                  <div>
                    <dt>Genero / Setor</dt>
                    <dd>{selectedProduct.sector}</dd>
                  </div>
                  <div>
                    <dt>Publico alvo</dt>
                    <dd>{selectedProduct.isKids ?? selectedProduct.sector === "Infantil" ? "Infantil" : "Adulto"}</dd>
                  </div>
                </dl>

                <div className="product-modal__buttons">
                  <button
                    type="button"
                    className="button"
                    onClick={() => handleAddToCartFromModal(selectedProduct)}
                  >
                    Adicionar ao carrinho
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      handleAddToCartFromModal(selectedProduct);
                      setIsCartOpen(true);
                    }}
                  >
                    Comprar agora
                  </button>
                </div>
              </div>
            </div>

            {relatedProducts.length ? (
              <section className="product-modal__related">
                <div className="section-heading section-heading--compact">
                  <div>
                    <span className="eyebrow eyebrow--muted">Voce tambem pode gostar</span>
                    <h3>Pecas parecidas com esta</h3>
                  </div>
                </div>

                <div className="related-scroll-wrap">
                  <div
                    className="mini-carousel"
                    aria-label="Produtos relacionados"
                  >
                    {relatedProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="mini-product-card"
                        onClick={() => {
                          const body = document.querySelector(
                            ".product-modal__body"
                          );
                          if (body) {
                            body.scrollTo({
                              top: 0,
                              behavior: "smooth"
                            });
                          }
                          setSelectedProduct(product);
                        }}
                      >
                        <div className="mini-product-card__image">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="mini-product-card__body">
                          <span className="mini-product-card__category">
                            {product.category}
                          </span>
                          <strong>{product.name}</strong>
                          <span className="mini-product-card__price">
                            {priceFormatter.format(product.price)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      {isZoomImageOpen && selectedProduct?.imageUrl ? (
        <div
          className="image-zoom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Ampliacao da imagem do produto"
          onClick={() => setIsZoomImageOpen(false)}
        >
          <button
            type="button"
            className="image-zoom-overlay__button"
            aria-label="Fechar ampliacao"
            onClick={(event) => {
              event.stopPropagation();
              setIsZoomImageOpen(false);
            }}
          >
            <CloseIcon />
          </button>
          <div className="image-zoom-overlay__frame" onClick={(event) => event.stopPropagation()}>
            <img
              src={selectedProduct.imageUrl}
              alt={selectedProduct.name}
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
