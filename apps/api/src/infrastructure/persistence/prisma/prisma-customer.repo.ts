import { Injectable } from '@nestjs/common';
import type {
  CreateCustomerInput,
  Customer,
  CustomerRepo,
} from '../../../application/ports/customer.repo';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaCustomerRepo implements CustomerRepo {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateCustomerInput): Promise<Customer> {
    return this.prisma.customer.create({ data: input });
  }

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }
}
