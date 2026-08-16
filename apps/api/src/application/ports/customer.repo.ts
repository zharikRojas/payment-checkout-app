export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: Date;
};

export type CreateCustomerInput = {
  fullName: string;
  email: string;
  phone: string;
};

export interface CustomerRepo {
  create(input: CreateCustomerInput): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
}

export const CUSTOMER_REPO = Symbol('CUSTOMER_REPO');
