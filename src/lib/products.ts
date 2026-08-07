import { mockProducts } from "../data/mockProducts";
import type { Product, ProductFeed, Sector } from "../types";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

type RawRecord = Record<string, unknown>;

const formatCategory = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return "Selecionados";
  }

  return value.trim();
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
  " lingerie",
  "feminino",
  "mulher",
  "mulheres"
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
  "homem",
  "homens"
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

const resolveSectorByText = (value: unknown): Sector | null => {
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

  if (KIDS_HINTS.some((hint) => normalized.includes(hint))) {
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

const CATEGORY_SECTOR_OVERRIDE: Record<string, Sector> = {
  Vestidos: "Feminino",
  Saias: "Feminino",
  Blusas: "Feminino",
  Acessorios: "Feminino",
  "Acessórios": "Feminino",
  Camisas: "Masculino",
  Bermudas: "Masculino",
  Calcas: "Masculino",
  Calças: "Masculino"
};

const formatSector = (
  value: unknown,
  fallbackContext: { category?: string; name?: string; description?: string }
): Sector => {
  if (typeof value === "string" && value.trim()) {
    const directMatch = NORMALIZED_SECTORS.find(
      (sector) => sector.toLowerCase() === value.trim().toLowerCase()
    );

    if (directMatch) {
      return directMatch;
    }
  }

  const byRawField = resolveSectorByText(value);
  if (byRawField) {
    return byRawField;
  }

  const category = fallbackContext.category ?? "";
  if (CATEGORY_SECTOR_OVERRIDE[category]) {
    return CATEGORY_SECTOR_OVERRIDE[category];
  }

  const context = [
    fallbackContext.category,
    fallbackContext.name,
    fallbackContext.description
  ]
    .filter(Boolean)
    .join(" ");

  const byContext = resolveSectorByText(context);
  if (byContext) {
    return byContext;
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
  const id = item.id ?? item._id ?? item.slug ?? `product-${index + 1}`;
  const name = item.name ?? item.title ?? item.nome;
  const imageUrl =
    item.imageUrl ??
    item.image_url ??
    item.image ??
    item.thumbnail ??
    item.foto ??
    item.cover;

  if (typeof name !== "string" || typeof imageUrl !== "string") {
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

  const category = formatCategory(item.category ?? item.categoria);
  const description = String(
    item.description ??
      item.descricao ??
      "Peca selecionada com curadoria para compor um guarda-roupa autoral."
  ).trim();
  const sector = formatSector(
    item.sector ??
      item.segment ??
      item.department ??
      item.departamento ??
      item.gender ??
      item.sexo ??
      item.target,
    {
      category,
      name: String(name),
      description
    }
  );

  const explicitIsNew = Boolean(item.isNew ?? item.is_new ?? item.novo);
  const computedIsNew = explicitIsNew || isNewByAge(createdAt, now);

  return {
    id: String(id),
    name: name.trim(),
    description,
    price: toNumber(item.price ?? item.valor),
    imageUrl,
    category,
    size: String(item.size ?? item.tamanho ?? "Unico").trim(),
    condition: String(item.condition ?? item.condicao ?? "Excelente").trim(),
    sector,
    createdAt,
    featured: Boolean(item.featured ?? item.destaque),
    isNew: computedIsNew
  };
};

const pickCollection = (payload: unknown): RawRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RawRecord => Boolean(item) && typeof item === "object");
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate = payload as Record<string, unknown>;
  const collection =
    candidate.products ?? candidate.data ?? candidate.items ?? candidate.results ?? [];

  if (!Array.isArray(collection)) {
    return [];
  }

  return collection.filter((item): item is RawRecord => Boolean(item) && typeof item === "object");
};

export const getProducts = async (signal?: AbortSignal): Promise<ProductFeed> => {
  if (!API_URL) {
    return {
      products: mockProducts,
      source: "mock"
    };
  }

  try {
    const response = await fetch(API_URL, { signal });

    if (!response.ok) {
      throw new Error(`API retornou ${response.status}`);
    }

    const payload = (await response.json()) as unknown;
    const products = pickCollection(payload).map(toProduct).filter((item): item is Product => Boolean(item));

    if (!products.length) {
      throw new Error("Nenhum produto valido encontrado.");
    }

    return {
      products,
      source: "api"
    };
  } catch {
    return {
      products: mockProducts,
      source: "mock"
    };
  }
};
