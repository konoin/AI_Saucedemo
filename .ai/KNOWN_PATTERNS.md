# Known Patterns

Real patterns from this repository. Reuse these — do not invent parallel implementations.

---

## Current Page Objects

### `LoginPage` — `framework/pages/LoginPage.ts`

```typescript
async login(username: string, password: string) {
  await this.page.goto('/');
  await this.page.getByTestId(loginSelectors.username).fill(username);
  await this.page.getByTestId(loginSelectors.password).fill(password);
  await this.page.getByTestId(loginSelectors.loginButton).click();
}
```

Uses `loginSelectors` from `@constants/selectors` (alias of `Selectors.login`).

### `InventoryPage` — `framework/pages/InventoryPage.ts`

- `addBackpackToCart()` — clicks `Selectors.inventory.addToCartBackpack`
- `openCart()` — clicks `Selectors.inventory.shoppingCartLink`

### `CartPage` — `framework/pages/CartPage.ts`

- `proceedToCheckout()` — clicks `Selectors.cart.checkout`

### `CheckoutPage` — `framework/pages/CheckoutPage.ts`

- `fillShippingInfo(customer: CheckoutCustomer)`
- `continueCheckout()`
- `finishOrder()`

### `CheckoutCompletePage` — `framework/pages/CheckoutCompletePage.ts`

- `expectThankYouMessage(message: string)` — assertion helper used from spec **Assert** phase

---

## Current Flows

### `LoginFlow` — `framework/flows/login.flow.ts`

```typescript
export class LoginFlow {
  constructor(private readonly loginPage: LoginPage) {}

  async loginAs(user: User) {
    await this.loginPage.login(user.username, user.password);
  }
}
```

### `CheckoutFlow` — `framework/flows/checkout.flow.ts`

```typescript
async completeOrder(customer: CheckoutCustomer) {
  await this.inventoryPage.addBackpackToCart();
  await this.inventoryPage.openCart();
  await this.cartPage.proceedToCheckout();
  await this.checkoutPage.fillShippingInfo(customer);
  await this.checkoutPage.continueCheckout();
  await this.checkoutPage.finishOrder();
}
```

No locators. No assertions.

---

## Current Fixtures

### `base.fixture.ts` — `framework/fixtures/base.fixture.ts`

Extends Playwright `test` with:

| Fixture                | Type                   |
| ---------------------- | ---------------------- |
| `loginPage`            | `LoginPage`            |
| `inventoryPage`        | `InventoryPage`        |
| `cartPage`             | `CartPage`             |
| `checkoutPage`         | `CheckoutPage`         |
| `checkoutCompletePage` | `CheckoutCompletePage` |

Specs import:

```typescript
import { test, expect } from "@fixtures/base.fixture";
```

---

## Current Selector Registry

### `framework/constants/selectors.ts`

```typescript
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
    completeHeader: "complete-header",
  },
} as const;
```

Legacy exports: `loginSelectors`, `inventorySelectors`, `cartSelectors`, `checkoutSelectors`.

Add new keys under the correct namespace before using in pages.

---

## Current Data Layer

### `framework/data/users.ts`

```typescript
export const standardUser: User = {
  username: "standard_user",
  password: "secret_sauce",
};
```

### `framework/data/checkout-customer.ts`

```typescript
export const defaultCheckoutCustomer: CheckoutCustomer = {
  firstName: "John",
  lastName: "Doe",
  postalCode: "12345",
};
```

Types: `@types` → `framework/types/user.ts`, `checkout-customer.ts`, barrel `index.ts`.

---

## Current Test Structure

### `framework/tests/checkout.spec.ts`

```typescript
test("@critical @smoke @regression successful checkout flow", async ({
  page,
  loginPage,
  inventoryPage,
  cartPage,
  checkoutPage,
  checkoutCompletePage,
}) => {
  const loginFlow = new LoginFlow(loginPage);
  const checkoutFlow = new CheckoutFlow(inventoryPage, cartPage, checkoutPage);

  await loginFlow.loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);

  await checkoutFlow.completeOrder(defaultCheckoutCustomer);

  await checkoutCompletePage.expectThankYouMessage(ORDER_COMPLETE_MESSAGE);
});
```

| Phase   | Implementation                                    |
| ------- | ------------------------------------------------- |
| Arrange | Fixtures + `LoginFlow` / `CheckoutFlow` instances |
| Act     | `loginFlow.loginAs`, `checkoutFlow.completeOrder` |
| Assert  | `expect(page).toHaveURL`, `expectThankYouMessage` |

### Example skeletons (not executed)

- `framework/tests/auth/login.spec.example.ts`
- `framework/tests/inventory/inventory.spec.example.ts`
- `framework/tests/cart/cart.spec.example.ts`

---

## Path aliases

| Alias          | Path                       |
| -------------- | -------------------------- |
| `@pages/*`     | `framework/pages/*`        |
| `@flows/*`     | `framework/flows/*`        |
| `@fixtures/*`  | `framework/fixtures/*`     |
| `@data/*`      | `framework/data/*`         |
| `@constants/*` | `framework/constants/*`    |
| `@types`       | `framework/types/index.ts` |

---

## Tags and CI

| Tag           | Command                   |
| ------------- | ------------------------- |
| `@smoke`      | `npm run test:smoke`      |
| `@regression` | `npm run test:regression` |
| `@critical`   | `npm run test:critical`   |

---

## Adding new coverage

1. Add to `Selectors` in `framework/constants/selectors.ts`
2. Extend or add Page Object in `framework/pages/`
3. Add Flow in `framework/flows/` if journey repeats
4. Add data in `framework/data/` if needed
5. Add spec under `framework/tests/<domain>/` with tags
6. Follow `.ai/AUTOMATION_GUIDE.md` and `.ai/PROMPTS/`
