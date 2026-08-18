import { mockProducts } from "../data/mockProducts";
import type { Product, Sector } from "../types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "");
const API_TOKEN = (import.meta.env.VITE_API_TOKEN as string | undefined)?.trim();

const PRODUCTS_ENDPOINT = "/api/public/produtos";

export type ProductsQuery = {
  limit?: number;
  offset?: number;
  q?: string;
  categoria?: string;
  genero?: string;
  infantil?: string;
};

export type ProductsPagination = {
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number;
};

export type ProductsFeed = {
  products: Product[];
  pagination: ProductsPagination;
  source: "api" | "mock";
};

type RawRecord = Record<string, unknown>;

const DEFAULT_PAGINATION: ProductsPagination = {
  limit: 50,
  offset: 0,
  hasMore: false,
  nextOffset: 0
};

const formatCategory = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return "Selecionados";
  }

  const trimmed = value.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const NORMALIZED_SECTORS: Sector[] = ["Feminino", "Masculino", "Infantil"];

const FEMININE_HINTS = [
  "vestido",
  "saia",
  "blusa",
  "bolsa",
  "salto",
  "scarpin",
  "body",
  "midi",
  "maxi",
  "evase",
  "evasê",
  "cropped",
  "biquini",
  "biquíni",
  "maio",
  "lingerie",
  "feminino",
  "mulher",
  "mulheres",
  "feminina",
  "feminina",
  "femea",
  "fêmea"
];

const MASCULINE_HINTS = [
  "camisa",
  "bermuda",
  "calca social",
  "calça social",
  "gravata",
  "terno",
  "blusa masculina",
  "camiseta masculina",
  "jaqueta masculina",
  "calcado masculino",
  "calçado masculino",
  "tenis masculino",
  "tênis masculino",
  "masculino",
  "masculina",
  "homem",
  "homens",
  "macho"
];

const KIDS_HINTS = [
  "infantil",
  "kids",
  "bebe",
  "bebê",
  "crianca",
  "criança",
  "mini",
  "juvenil",
  "baby"
];

const parseKidsFlag = (value: unknown): { kids: boolean; explicit: boolean } => {
  if (typeof value === "boolean") {
    return { kids: value, explicit: true };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return { kids: value === 1, explicit: true };
  }

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (["true", "1", "sim", "s", "yes", "y"].includes(normalized)) {
      return { kids: true, explicit: true };
    }
    if (["false", "0", "nao", "n", "no", "not"].includes(normalized)) {
      return { kids: false, explicit: true };
    }
  }

  return { kids: false, explicit: false };
};

const resolveSectorByText = (value: unknown, allowKids = true): Sector | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (NORMALIZED_SECTORS.some((sector) => sector.toLowerCase() === normalized)) {
    return value.trim() as Sector;
  }

  if (allowKids && KIDS_HINTS.some((hint) => normalized.includes(hint))) {
    return "Infantil";
  }

  if (MASCULINE_HINTS.some((hint) => normalized.includes(hint))) {
    return "Masculino";
  }

  if (FEMININE_HINTS.some((hint) => normalized.includes(hint))) {
    return "Feminino";
  }

  return null;
};

const formatSectorFromApi = (
  genero: unknown,
  infantil: unknown,
  fallbackContext: { category?: string; name?: string; description?: string }
): Sector => {
  const kidsParsed = parseKidsFlag(infantil);

  if (kidsParsed.explicit && kidsParsed.kids) {
    return "Infantil";
  }

  const explicitAdult = kidsParsed.explicit && !kidsParsed.kids;
  const allowHeuristicKids = !explicitAdult;

  if (typeof genero === "string" && genero.trim()) {
    const direct = resolveSectorByText(genero, allowHeuristicKids);
    if (direct) {
      return direct;
    }
  }

  const context = [fallbackContext.category, fallbackContext.name, fallbackContext.description]
    .filter(Boolean)
    .join(" ");

  const byContext = resolveSectorByText(context, allowHeuristicKids);
  if (byContext) {
    return byContext;
  }

  if (!allowHeuristicKids) {
    if (typeof genero === "string" && genero.trim()) {
      const direct = resolveSectorByText(genero, true);
      if (direct && direct === "Masculino") return "Masculino";
      if (direct && direct === "Feminino") return "Feminino";
    }
    const byContextRetry = resolveSectorByText(context, true);
    if (byContextRetry === "Masculino") return "Masculino";
  }

  return "Feminino";
};

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const parsed = Number(normalized);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const toDate = (value: unknown, fallbackNow: Date): Date => {
  if (value instanceof Date) {
    const asTime = value.getTime();
    return Number.isFinite(asTime) ? value : fallbackNow;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const asDate = new Date(value);
    return Number.isFinite(asDate.getTime()) ? asDate : fallbackNow;
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.trim();
    const direct = new Date(normalized);
    if (Number.isFinite(direct.getTime())) {
      return direct;
    }

    const dateOnly = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dateOnly) {
      const day = Number(dateOnly[1]);
      const month = Number(dateOnly[2]);
      const year = Number(dateOnly[3]);
      const iso = new Date(
        year > 99 ? year : 2000 + year,
        Math.max(0, month - 1),
        Math.max(1, Math.min(31, day))
      );
      if (Number.isFinite(iso.getTime())) {
        return iso;
      }
    }

    const milliseconds = Number(normalized);
    if (Number.isFinite(milliseconds)) {
      const numericDate = new Date(milliseconds);
      if (Number.isFinite(numericDate.getTime())) {
        return numericDate;
      }
    }
  }

  return fallbackNow;
};

const isNewByAge = (createdAt: Date, now: Date = new Date()) => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const time = createdAt.getTime();
  const nowMs = now.getTime();
  return Number.isFinite(time) && time > nowMs - SEVEN_DAYS_MS && time <= nowMs + 60_000;
};

const toProduct = (item: RawRecord, index: number): Product | null => {
  const id =
    item.id ??
    item.codigo ??
    item.codigoProduto ??
    item._id ??
    item.slug ??
    `product-${index + 1}`;

  const nameCandidate =
    item.name ??
    item.title ??
    item.nome ??
    item.descricao ??
    item.description;

  const descriptionCandidate =
    item.description ??
    item.descricao ??
    (item.marca && item.cor && item.tamanho
      ? `Peca ${String(item.marca).trim()}, cor ${String(item.cor).trim()}, tamanho ${String(item.tamanho).trim()}.`
      : undefined);

  const price =
    toNumber(item.price ?? item.valor ?? item.precoVenda ?? item.preco_venda);

  const imageUrl =
    item.imageUrl ??
    item.image_url ??
    item.image ??
    item.thumbnail ??
    item.foto ??
    item.cover ??
    item.imagem ??
    item.imagemUrl;

  if (typeof nameCandidate !== "string" || !nameCandidate.trim()) {
    return null;
  }

  const now = new Date();
  const fallbackCreatedAtMs = now.getTime() - index * (12 * 60 * 60 * 1000);
  const createdAt = toDate(
    item.createdAt ??
      item.created_at ??
      item.publishedAt ??
      item.published_at ??
      item.updatedAt ??
      item.updated_at ??
      item.dataCriacao ??
      item.data_criacao ??
      item.data ??
      item.date ??
      new Date(fallbackCreatedAtMs),
    new Date(fallbackCreatedAtMs)
  );

  const rawCategoriaValue =
    typeof item.categoria === "string" ? item.categoria :
    typeof item.category === "string" ? item.category : null;
  const category = formatCategory(item.category ?? item.categoria);
  const brand = String(item.brand ?? item.marca ?? "").trim();
  const color = String(item.color ?? item.cor ?? "").trim();
  const description = String(
    descriptionCandidate ??
      "Peca selecionada com curadoria para compor um guarda-roupa autoral."
  ).trim();

  const sector = formatSectorFromApi(item.genero ?? item.gender ?? item.sexo, item.infantil, {
    category,
    name: String(nameCandidate),
    description
  });

  const kidsParsed = parseKidsFlag(item.infantil);
  const isKids = kidsParsed.explicit ? kidsParsed.kids : sector === "Infantil";

  const size =
    String(item.size ?? item.tamanho ?? "Unico").trim() || "Unico";
  const condition = buildConditionFromFields(item.condicao ?? item.condition);

  const computedIsNew = isNewByAge(createdAt, now);

  return {
    id: String(id),
    name: String(nameCandidate).trim(),
    description,
    price: price <= 0 ? 0 : price,
    imageUrl: typeof imageUrl === "string" ? imageUrl : "",
    category,
    rawCategory: rawCategoriaValue,
    brand,
    color,
    size,
    condition,
    sector,
    createdAt,
    featured: Boolean(item.featured ?? item.destaque),
    isNew: computedIsNew,
    isKids
  };
};

const CONDITION_LABELS = {
  excelente: "Excelente",
  "muito bom": "Muito bom",
  muitoBom: "Muito bom",
  bom: "Bom",
  regular: "Regular"
} as const;

const buildConditionFromFields = (value: unknown): string => {
  if (typeof value === "string" && value.trim()) {
    const normalized = value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (normalized.includes("excelent")) return CONDITION_LABELS.excelente;
    if (normalized.includes("muito bom")) return CONDITION_LABELS["muito bom"];
    if (normalized.includes("muitobom")) return CONDITION_LABELS["muito bom"];
    if (normalized.includes("bom")) return CONDITION_LABELS.bom;
    if (normalized.includes("regular")) return CONDITION_LABELS.regular;
    return value.trim();
  }

  return CONDITION_LABELS.excelente;
};

const pickCollection = (payload: unknown): RawRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RawRecord => Boolean(item) && typeof item === "object");
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate = payload as Record<string, unknown>;
  const collection = candidate.produtos ?? candidate.products ?? candidate.data ?? candidate.items ?? candidate.results ?? [];

  if (!Array.isArray(collection)) {
    return [];
  }

  return collection.filter((item): item is RawRecord => Boolean(item) && typeof item === "object");
};

const pickPagination = (payload: unknown, fallback: ProductsPagination): ProductsPagination => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = (payload as Record<string, unknown>).paginacao ??
    (payload as Record<string, unknown>).pagination;

  if (!candidate || typeof candidate !== "object") {
    return fallback;
  }

  const p = candidate as Record<string, unknown>;
  const limit = typeof p.limit === "number" && Number.isFinite(p.limit) ? p.limit : fallback.limit;
  const offset = typeof p.offset === "number" && Number.isFinite(p.offset) ? p.offset : fallback.offset;
  const hasMore = typeof p.hasMore === "boolean" ? p.hasMore : Boolean(p.hasMore);
  const nextOffset =
    typeof p.nextOffset === "number" && Number.isFinite(p.nextOffset)
      ? p.nextOffset
      : hasMore
        ? offset + limit
        : offset;

  return { limit, offset, hasMore, nextOffset };
};

const buildProductsUrl = (query: ProductsQuery) => {
  const params = new URLSearchParams();
  const limit = query.limit && query.limit > 0 ? Math.min(200, query.limit) : 50;
  const offset = query.offset && query.offset > 0 ? query.offset : 0;

  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (typeof query.q === "string" && query.q.trim()) {
    params.set("q", query.q.trim());
  }

  if (typeof query.categoria === "string" && query.categoria.trim()) {
    params.set("categoria", query.categoria.trim());
  }

  if (typeof query.genero === "string" && query.genero.trim()) {
    params.set("genero", query.genero.trim());
  }

  if (typeof query.infantil === "string" && query.infantil.trim()) {
    params.set("infantil", query.infantil.trim());
  }

  const search = params.toString();
  const base = `${API_URL ?? ""}${PRODUCTS_ENDPOINT}`;
  return search ? `${base}?${search}` : base;
};

const buildHeaders = () => {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (API_TOKEN) {
    headers.Authorization = `Bearer ${API_TOKEN}`;
  }

  return headers;
};

const paginateMock = (products: Product[], query: ProductsQuery): ProductsFeed => {
  const limit = query.limit && query.limit > 0 ? Math.min(200, query.limit) : 50;
  const offset = query.offset && query.offset > 0 ? query.offset : 0;

  let list = products;

  if (typeof query.q === "string" && query.q.trim()) {
    const normalized = query.q.trim().toLowerCase();
    list = list.filter((product) =>
      `${product.name} ${product.description} ${product.category} ${product.size}`
        .toLowerCase()
        .includes(normalized)
    );
  }

  if (typeof query.categoria === "string" && query.categoria.trim()) {
    const target = query.categoria.trim();
    list = list.filter((product) => product.category.toLowerCase() === target.toLowerCase());
  }

  const hasMore = offset + limit < list.length;
  const nextOffset = hasMore ? offset + limit : Math.max(0, list.length - limit);
  const sliced = list.slice(offset, offset + limit);

  return {
    products: sliced,
    pagination: { limit, offset, hasMore, nextOffset },
    source: "mock"
  };
};

export const getProducts = async (
  query: ProductsQuery = {},
  signal?: AbortSignal
): Promise<ProductsFeed> => {
  if (!API_URL || !API_TOKEN) {
    return paginateMock(mockProducts, query);
  }

  try {
    const url = buildProductsUrl(query);
    const response = await fetch(url, { signal, headers: buildHeaders() });

    if (!response.ok) {
      throw new Error(`API retornou ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const rawList = pickCollection(payload);
    const mapped = rawList.map(toProduct).filter((item): item is Product => Boolean(item));
    const fallbackPagination: ProductsPagination = {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      hasMore: false,
      nextOffset: query.offset ?? 0
    };

    return {
      products: mapped,
      pagination: pickPagination(payload, fallbackPagination),
      source: "api"
    };
  } catch {
    return paginateMock(mockProducts, query);
  }
};

export const getSectorsAndCategoriesFromProducts = (products: Product[]) => {
  const sectorMap = new Map<Sector, Set<string>>();

  for (const sector of NORMALIZED_SECTORS) {
    sectorMap.set(sector, new Set<string>());
  }

  for (const product of products) {
    const bucket = sectorMap.get(product.sector);
    if (bucket) {
      bucket.add(product.category);
    }
  }

  const allCategories = Array.from(
    new Set(Array.from(sectorMap.values()).flatMap((set) => Array.from(set)))
  );

  return {
    sectors: NORMALIZED_SECTORS,
    allCategories,
    sectorCategories: Object.fromEntries(
      Array.from(sectorMap.entries()).map(([sector, set]) => [sector, Array.from(set)])
    ) as Record<Sector, string[]>
  };
};
