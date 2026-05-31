export const Selectors = {
  login: {
    username: "username",
    password: "password",
    loginButton: "login-button",
  },
  inventory: {
    shoppingCartLink: "shopping-cart-link",
    addToCartBackpack: "add-to-cart-sauce-labs-backpack",
  },
  cart: {
    checkout: "checkout",
  },
  checkout: {
    firstName: "firstName",
    lastName: "lastName",
    postalCode: "postalCode",
    continueButton: "continue",
    finish: "finish",
    completeHeader: 'complete-header',
  },
} as const;

/** @deprecated Use Selectors.login — kept for backward-compatible imports */
export const loginSelectors = Selectors.login;

/** @deprecated Use Selectors.inventory */
export const inventorySelectors = Selectors.inventory;

/** @deprecated Use Selectors.cart */
export const cartSelectors = Selectors.cart;

/** @deprecated Use Selectors.checkout */
export const checkoutSelectors = Selectors.checkout;
