import { Module } from '@nestjs/common';
import { CUSTOMER_REPO } from '../../application/ports/customer.repo';
import { DELIVERY_REPO } from '../../application/ports/delivery.repo';
import { PAYMENT_GATEWAY } from '../../application/ports/payment.gateway';
import { PRODUCT_REPO } from '../../application/ports/product.repo';
import { TRANSACTION_REPO } from '../../application/ports/transaction.repo';
import { SandboxPaymentGateway } from '../payments/sandbox.payment.gateway';
import { PrismaCustomerRepo } from '../persistence/prisma/prisma-customer.repo';
import { PrismaDeliveryRepo } from '../persistence/prisma/prisma-delivery.repo';
import { PrismaProductRepo } from '../persistence/prisma/prisma-product.repo';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { PrismaTransactionRepo } from '../persistence/prisma/prisma-transaction.repo';
import { CustomersController } from './customers.controller';
import { DeliveriesController } from './deliveries.controller';
import { ProductsController } from './products.controller';
import { TransactionsController } from './transactions.controller';

@Module({
  controllers: [
    ProductsController,
    CustomersController,
    DeliveriesController,
    TransactionsController,
  ],
  providers: [
    PrismaService,
    { provide: PRODUCT_REPO, useClass: PrismaProductRepo },
    { provide: CUSTOMER_REPO, useClass: PrismaCustomerRepo },
    { provide: DELIVERY_REPO, useClass: PrismaDeliveryRepo },
    { provide: TRANSACTION_REPO, useClass: PrismaTransactionRepo },
    { provide: PAYMENT_GATEWAY, useClass: SandboxPaymentGateway },
  ],
})
export class DomainHttpModule {}
