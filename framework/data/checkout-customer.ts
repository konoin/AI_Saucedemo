import type { CheckoutCustomer } from '@types';

export const defaultCheckoutCustomer: CheckoutCustomer = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};

export const missingFirstNameCustomer: CheckoutCustomer = {
  firstName: '',
  lastName: 'Miller',
  postalCode: '30303',
};

export const missingLastNameCustomer: CheckoutCustomer = {
  firstName: 'Emma',
  lastName: '',
  postalCode: '30303',
};

export const missingPostalCodeCustomer: CheckoutCustomer = {
  firstName: 'Liam',
  lastName: 'Brown',
  postalCode: '',
};

export const longInputCheckoutCustomer: CheckoutCustomer = {
  firstName: 'a'.repeat(500),
  lastName: 'a'.repeat(500),
  postalCode: '99999',
};

export const specialCharacterCheckoutCustomer: CheckoutCustomer = {
  firstName: 'Alex!@#$',
  lastName: 'OConnor-Test',
  postalCode: 'ABC-123',
};
