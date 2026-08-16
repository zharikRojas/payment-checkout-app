import { Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import type { Product, ProductRepo } from '../../../application/ports/product.repo';
import { calcAvailableStock } from '../../../application/use-cases/create-pending-transaction';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaProductRepo implements ProductRepo {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Product[]> {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async availableStock(productId: string): Promise<number> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return 0;
    const agg = await this.prisma.stockReservation.aggregate({
      where: { productId, status: ReservationStatus.ACTIVE },
      _sum: { qty: true },
    });
    return calcAvailableStock(product.stock, agg._sum.qty ?? 0);
  }
}
