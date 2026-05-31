export const Selectors = {
  login: {
    username: "username",
    password: "password",
    loginButton: "login-button",
  },
  inventory: {
    shoppingCartLink: "shopping-cart-link",
    shoppingCartBadge: "shopping-cart-badge",
    menuButton: "react-burger-menu-btn",
    logoutSidebarLink: "logout-sidebar-link",
    item: "inventory-item",
    itemName: "inventory-item-name",
    itemPrice: "inventory-item-price",
    addToCartBackpack: "add-to-cart-sauce-labs-backpack",
    addToCartBikeLight: "add-to-cart-sauce-labs-bike-light",
    addToCartBoltTShirt: "add-to-cart-sauce-labs-bolt-t-shirt",
    removeBackpack: "remove-sauce-labs-backpack",
    removeBikeLight: "remove-sauce-labs-bike-light",
    removeBoltTShirt: "remove-sauce-labs-bolt-t-shirt",
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
    error: "error",
    title: "title",
    subtotal: "subtotal-label",
    tax: "tax-label",
    total: "total-label",
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
