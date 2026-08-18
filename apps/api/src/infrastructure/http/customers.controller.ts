import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { CUSTOMER_REPO, type CustomerRepo } from '../../application/ports/customer.repo';
import { createCustomer } from '../../application/use-cases/create-customer';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { unwrapResult } from './unwrap-result';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(@Inject(CUSTOMER_REPO) private readonly customers: CustomerRepo) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Customer created' })
  async create(@Body() body: CreateCustomerDto) {
    return unwrapResult(await createCustomer(this.customers, body));
  }
}
