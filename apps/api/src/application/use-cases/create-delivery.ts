import { err, ok, type Result } from '../result';
import type { CustomerRepo } from '../ports/customer.repo';
import type { Delivery, DeliveryRepo, CreateDeliveryInput } from '../ports/delivery.repo';

export async function createDelivery(
  customers: CustomerRepo,
  deliveries: DeliveryRepo,
  input: CreateDeliveryInput,
): Promise<Result<Delivery>> {
  if (
    !input.customerId ||
    !input.addressLine1?.trim() ||
    !input.city?.trim() ||
    !input.region?.trim() ||
    !input.postalCode?.trim() ||
    !input.phone?.trim()
  ) {
    return err({
      code: 'VALIDATION',
      message: 'customerId, addressLine1, city, region, postalCode and phone are required',
    });
  }
  const customer = await customers.findById(input.customerId);
  if (!customer) {
    return err({ code: 'NOT_FOUND', message: 'Customer not found' });
  }
  return ok(await deliveries.create(input));
}
