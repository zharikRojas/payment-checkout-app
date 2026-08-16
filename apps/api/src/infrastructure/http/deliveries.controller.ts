import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CUSTOMER_REPO, type CustomerRepo } from '../../application/ports/customer.repo';
import { DELIVERY_REPO, type DeliveryRepo } from '../../application/ports/delivery.repo';
import { createDelivery } from '../../application/use-cases/create-delivery';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { unwrapResult } from './unwrap-result';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(
    @Inject(CUSTOMER_REPO) private readonly customers: CustomerRepo,
    @Inject(DELIVERY_REPO) private readonly deliveries: DeliveryRepo,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Delivery created' })
  async create(@Body() body: CreateDeliveryDto) {
    return unwrapResult(await createDelivery(this.customers, this.deliveries, body));
  }
}
