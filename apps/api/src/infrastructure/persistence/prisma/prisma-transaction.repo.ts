import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReservationStatus, TransactionStatus } from '@prisma/client';
import type {
  CreatePendingInput,
  Transaction,
  TransactionRepo,
} from '../../../application/ports/transaction.repo';
import {
  calcAvailableStock,
  OutOfStockError,
} from '../../../application/use-cases/create-pending-transaction';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTransactionRepo implements TransactionRepo {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  async createPending(input: CreatePendingInput): Promise<Transaction> {
    // ponytail: check+create in $transaction; race window small — SERIALIZABLE if contention hurts
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: input.productId } });
      if (!product) {
        throw new Error('Product not found');
      }

      const agg = await tx.stockReservation.aggregate({
        where: { productId: input.productId, status: ReservationStatus.ACTIVE },
        _sum: { qty: true },
      });
      const available = calcAvailableStock(product.stock, agg._sum.qty ?? 0);
      if (available < input.qty) {
        throw new OutOfStockError();
      }

      const created = await tx.transaction.create({
        data: {
          reference: `ref_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
          productId: input.productId,
          customerId: input.customerId,
          qty: input.qty,
          status: TransactionStatus.PENDING,
          amountCents: input.amountCents,
          baseFeeCents: input.baseFeeCents,
          deliveryFeeCents: input.deliveryFeeCents,
          currency: input.currency,
        },
      });

      await tx.stockReservation.create({
        data: {
          productId: input.productId,
          transactionId: created.id,
          qty: input.qty,
          status: ReservationStatus.ACTIVE,
        },
      });

      if (input.delivery) {
        await tx.delivery.create({
          data: {
            customerId: input.customerId,
            transactionId: created.id,
            addressLine1: input.delivery.addressLine1,
            city: input.delivery.city,
            region: input.delivery.region,
            postalCode: input.delivery.postalCode,
            phone: input.delivery.phone,
            notes: input.delivery.notes,
          },
        });
      }

      return created;
    });
  }
}
