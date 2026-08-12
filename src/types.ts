export type Sector = "Feminino" | "Masculino" | "Infantil";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  condition: string;
  sector: Sector;
  createdAt: Date;
  featured?: boolean;
  isNew?: boolean;
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
