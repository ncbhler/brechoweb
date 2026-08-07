export type Sector = "Feminino" | "Masculino" | "Infantil";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  size: string;
  condition: string;
  sector: Sector;
  createdAt: Date;
  featured?: boolean;
  isNew?: boolean;
};

export type ProductFeed = {
  products: Product[];
  source: "api" | "mock";
};
