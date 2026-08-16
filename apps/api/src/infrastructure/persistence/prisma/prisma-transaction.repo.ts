import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReservationStatus, TransactionStatus } from '@prisma/client';
import type {
  CreatePendingInput,
  FinalProviderStatus,
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

  findByReference(reference: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({ where: { reference } });
  }

  findByProviderTxId(providerTxId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({ where: { providerTxId } });
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

  setProviderInfo(input: {
    transactionId: string;
    providerTxId: string;
    providerStatus: string;
  }): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: { id: input.transactionId },
      data: {
        providerTxId: input.providerTxId,
        providerStatus: input.providerStatus,
      },
    });
  }

  async finalizeFromProvider(input: {
    transactionId: string;
    providerTxId: string;
    providerStatus: string;
    finalStatus: FinalProviderStatus;
  }): Promise<Transaction> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.transaction.findUnique({
        where: { id: input.transactionId },
      });
      if (!current) throw new Error('Transaction not found');

      if (current.status !== TransactionStatus.PENDING) {
        return current;
      }

      const updated = await tx.transaction.update({
        where: { id: input.transactionId },
        data: {
          status: input.finalStatus as TransactionStatus,
          providerTxId: input.providerTxId,
          providerStatus: input.providerStatus,
        },
      });

      const reservation = await tx.stockReservation.findUnique({
        where: { transactionId: input.transactionId },
      });

      if (input.finalStatus === 'APPROVED') {
        if (reservation?.status === ReservationStatus.ACTIVE) {
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: { status: ReservationStatus.CONFIRMED },
          });
          await tx.product.update({
            where: { id: current.productId },
            data: { stock: { decrement: current.qty } },
          });
        }
        await tx.delivery.updateMany({
          where: { transactionId: input.transactionId },
          data: { status: 'ASSIGNED' },
        });
      } else if (reservation?.status === ReservationStatus.ACTIVE) {
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: ReservationStatus.RELEASED },
        });
      }

      return updated;
    });
  }
}
