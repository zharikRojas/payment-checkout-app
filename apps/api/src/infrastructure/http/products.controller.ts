import { Controller, Get, Inject, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PRODUCT_REPO, type ProductRepo } from '../../application/ports/product.repo';
import { getProduct, listProducts } from '../../application/use-cases/products';
import { unwrapResult } from './unwrap-result';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(@Inject(PRODUCT_REPO) private readonly products: ProductRepo) {}

  @Get()
  @ApiOkResponse({ description: 'Product list with availableStock' })
  async list() {
    return unwrapResult(await listProducts(this.products));
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Product detail with availableStock' })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return unwrapResult(await getProduct(this.products, id));
  }
}
