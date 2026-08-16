import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import {
  TRANSACTION_REPO,
  type TransactionRepo,
} from '../../application/ports/transaction.repo';
import { handlePaymentWebhook } from '../../application/use-cases/handle-payment-webhook';
import { unwrapResult } from './unwrap-result';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    @Inject(TRANSACTION_REPO) private readonly transactions: TransactionRepo,
  ) {}

  @Post('payments')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Webhook accepted / processed' })
  @ApiUnauthorizedResponse({ description: 'Invalid event checksum' })
  async payments(
    @Body() body: unknown,
    @Headers('x-event-checksum') checksum?: string,
  ) {
    return unwrapResult(
      await handlePaymentWebhook(
        this.transactions,
        process.env.PAYMENT_EVENTS_SECRET ?? '',
        body,
        checksum,
      ),
    );
  }
}
