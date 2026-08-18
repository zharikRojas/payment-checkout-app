export type Product = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  createdAt: Date;
};

export type ProductWithAvailability = Product & { availableStock: number };

export interface ProductRepo {
  list(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  availableStock(productId: string): Promise<number>;
}

export const PRODUCT_REPO = Symbol('PRODUCT_REPO');
