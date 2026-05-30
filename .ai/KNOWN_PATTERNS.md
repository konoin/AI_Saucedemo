# Known Patterns

Long-term AI memory for this repository. Follow these patterns before inventing new structure.

---

## Authentication Flow

**Goal:** Log in as a known user and land on the inventory page.

| Piece | Location |
|-------|----------|
| Page Object | `LoginPage` — `framework/pages/LoginPage.ts` |
| Flow | `LoginFlow.loginAs(user)` — `framework/flows/login.flow.ts` |
| Test data | `standardUser` — `framework/data/users.ts` |
| Selectors | `Selectors.login` — `framework/constants/selectors.ts` |

**Steps:**

1. `LoginPage.login(username, password)` — navigates to `/`, fills credentials, submits
2. Prefer `LoginFlow.loginAs(standardUser)` in specs to avoid duplicating credentials
3. Assert in the **test**: `await expect(page).toHaveURL(/inventory/)`

**Do not** put URL assertions inside flows or page objects.

---

## Checkout Flow

**Goal:** Add backpack, open cart, complete checkout through confirmation screen (assertion in test).

| Piece | Location |
|-------|----------|
| Pages | `InventoryPage`, `CartPage`, `CheckoutPage`, `CheckoutCompletePage` |
| Flow | `CheckoutFlow.completeOrder(customer)` — `framework/flows/checkout.flow.ts` |
| Test data | `defaultCheckoutCustomer` — `framework/data/checkout-customer.ts` |
| Selectors | `Selectors.inventory`, `Selectors.cart`, `Selectors.checkout` |

**Flow steps (no assertions):**

1. `InventoryPage.addBackpackToCart()`
2. `InventoryPage.openCart()`
3. `CartPage.proceedToCheckout()`
4. `CheckoutPage.fillShippingInfo(customer)`
5. `CheckoutPage.continueCheckout()`
6. `CheckoutPage.finishOrder()`

**Assertion (test only):**

- `CheckoutCompletePage.expectThankYouMessage('Thank you for your order!')`

---

## Test Pattern

**Imports:**

```typescript
import { test, expect } from '@fixtures/base.fixture';
import { standardUser } from '@data/users';
import { LoginFlow } from '@flows/login.flow';
import { CheckoutFlow } from '@flows/checkout.flow';
```

**Structure: Arrange → Act → Assert**

| Phase | Responsibility |
|-------|----------------|
| Arrange | Fixtures provide pages; flows receive page instances |
| Act | Flows and/or page methods execute the journey |
| Assert | `expect()` only in the spec (or completion page helper used from spec) |

**Tags:**

- `@smoke` — fast confidence check
- `@regression` — broader regression suite
- `@critical` — business-critical path

**Example:** `framework/tests/checkout.spec.ts`

**Run by tag:**

```bash
npm run test:smoke
npm run test:regression
npm run test:critical
```

---

## Path aliases

| Alias | Use |
|-------|-----|
| `@pages/*` | Page Objects |
| `@flows/*` | Business flows |
| `@fixtures/*` | Playwright fixtures |
| `@data/*` | Users, customers |
| `@constants/*` | Selector registry |
| `@types` | Shared TypeScript types |

---

## Adding something new

1. Add selectors to `Selectors` in `framework/constants/selectors.ts`
2. Add or extend a Page Object
3. Add a Flow if the journey is reused across tests
4. Keep the spec thin: tags + Arrange/Act/Assert
5. Copy from `.ai/templates/` when generating files
