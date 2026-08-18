import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { PAYMENT_GATEWAY, type PaymentGateway } from '../../application/ports/payment.gateway';
import { CreateCardTokenDto } from './dto/create-card-token.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly log = new Logger(PaymentsController.name);

  constructor(@Inject(PAYMENT_GATEWAY) private readonly payments: PaymentGateway) {}

  @Post('card-tokens')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Card token from payment provider (via server proxy)' })
  async createCardToken(@Body() body: CreateCardTokenDto): Promise<{ token: string }> {
    try {
      // never log body.number / body.cvc / body.cardHolder
      return await this.payments.tokenizeCard({
        number: body.number,
        cvc: body.cvc,
        expMonth: body.expMonth,
        expYear: body.expYear,
        cardHolder: body.cardHolder,
      });
    } catch (e) {
      this.log.warn(`tokenize.failed ${e instanceof Error ? e.message : 'unknown'}`);
      throw new HttpException('Card tokenization failed', HttpStatus.BAD_GATEWAY);
    }
  }
}
