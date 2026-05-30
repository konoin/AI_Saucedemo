export const loginSelectors = {
  username: 'username',
  password: 'password',
  loginButton: 'login-button',
} as const;

export const inventorySelectors = {
  shoppingCartLink: 'shopping-cart-link',
  addToCartBackpack: 'add-to-cart-sauce-labs-backpack',
} as const;

export const cartSelectors = {
  checkout: 'checkout',
} as const;

export const checkoutSelectors = {
  firstName: 'firstName',
  lastName: 'lastName',
  postalCode: 'postalCode',
  continueButton: 'continue',
  finish: 'finish',
  completeHeader: 'complete-header',
} as const;
