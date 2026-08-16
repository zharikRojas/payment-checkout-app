import { Injectable } from '@nestjs/common';
import type {
  CreateDeliveryInput,
  Delivery,
  DeliveryRepo,
} from '../../../application/ports/delivery.repo';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaDeliveryRepo implements DeliveryRepo {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateDeliveryInput): Promise<Delivery> {
    return this.prisma.delivery.create({
      data: {
        customerId: input.customerId,
        transactionId: input.transactionId,
        addressLine1: input.addressLine1,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        phone: input.phone,
        notes: input.notes,
      },
    });
  }
}
