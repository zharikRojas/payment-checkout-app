import { err, ok, type Result } from '../result';
import type { Customer, CustomerRepo, CreateCustomerInput } from '../ports/customer.repo';

export async function createCustomer(
  customers: CustomerRepo,
  input: CreateCustomerInput,
): Promise<Result<Customer>> {
  if (!input.fullName?.trim() || !input.email?.trim() || !input.phone?.trim()) {
    return err({ code: 'VALIDATION', message: 'fullName, email and phone are required' });
  }
  return ok(await customers.create(input));
}
