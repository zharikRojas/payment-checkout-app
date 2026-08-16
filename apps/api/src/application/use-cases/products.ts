import { err, ok, type Result } from '../result';
import type { ProductRepo, ProductWithAvailability } from '../ports/product.repo';

export async function listProducts(
  products: ProductRepo,
): Promise<Result<ProductWithAvailability[]>> {
  const list = await products.list();
  const withStock = await Promise.all(
    list.map(async (p) => ({
      ...p,
      availableStock: await products.availableStock(p.id),
    })),
  );
  return ok(withStock);
}

export async function getProduct(
  products: ProductRepo,
  id: string,
): Promise<Result<ProductWithAvailability>> {
  const product = await products.findById(id);
  if (!product) {
    return err({ code: 'NOT_FOUND', message: 'Product not found' });
  }
  const availableStock = await products.availableStock(id);
  return ok({ ...product, availableStock });
}
