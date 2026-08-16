import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CUSTOMER_REPO, type CustomerRepo } from '../../application/ports/customer.repo';
import { PAYMENT_GATEWAY, type PaymentGateway } from '../../application/ports/payment.gateway';
import { PRODUCT_REPO, type ProductRepo } from '../../application/ports/product.repo';
import {
  TRANSACTION_REPO,
  type TransactionRepo,
} from '../../application/ports/transaction.repo';
import {
  createPendingTransaction,
  getTransaction,
} from '../../application/use-cases/create-pending-transaction';
import { payTransaction } from '../../application/use-cases/pay-transaction';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';
import { unwrapResult } from './unwrap-result';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    @Inject(PRODUCT_REPO) private readonly products: ProductRepo,
    @Inject(CUSTOMER_REPO) private readonly customers: CustomerRepo,
    @Inject(TRANSACTION_REPO) private readonly transactions: TransactionRepo,
    @Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGateway,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'PENDING transaction + stock reservation' })
  async create(@Body() body: CreateTransactionDto) {
    return unwrapResult(
      await createPendingTransaction(this.products, this.customers, this.transactions, {
        productId: body.productId,
        customerId: body.customerId,
        qty: body.qty,
        delivery: body.delivery,
      }),
    );
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Charge transaction via payment provider' })
  async pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PayTransactionDto,
  ) {
    return unwrapResult(
      await payTransaction(this.transactions, this.customers, this.payments, {
        transactionId: id,
        token: body.token,
        acceptanceToken: body.acceptanceToken,
        installments: body.installments,
      }),
    );
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Transaction by id' })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return unwrapResult(await getTransaction(this.transactions, id));
  }
}
