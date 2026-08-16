export type Delivery = {
  id: string;
  customerId: string;
  transactionId: string | null;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  notes: string | null;
  status: string;
  createdAt: Date;
};

export type CreateDeliveryInput = {
  customerId: string;
  transactionId?: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  notes?: string;
};

export interface DeliveryRepo {
  create(input: CreateDeliveryInput): Promise<Delivery>;
}

export const DELIVERY_REPO = Symbol('DELIVERY_REPO');
