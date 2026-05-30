# Test Organization

## Folder strategy

Tests live under `framework/tests/` and are grouped by **application domain**:

```
framework/tests/
├── checkout.spec.ts          ← active regression (root — legacy placement)
├── auth/                     ← login, session, locked users
├── inventory/                ← product list, sort, add to cart
├── cart/                     ← cart contents, remove items
└── checkout/                 ← future: specs moved here when convenient
```

## Rules

| Rule | Detail |
|------|--------|
| Production specs | `*.spec.ts` or `*.test.ts` only |
| Examples / skeletons | `*.spec.example.ts` (ignored by runner) |
| Do not duplicate | One spec file per focused scenario group |
| Tags | `@smoke`, `@regression`, `@critical` in test title |
| Imports | Use `@fixtures`, `@flows`, `@data` path aliases |

## Where to add new tests

| Domain | Folder | Flows / pages |
|--------|--------|----------------|
| Authentication | `auth/` | `LoginFlow`, `LoginPage` |
| Inventory | `inventory/` | `InventoryPage` |
| Cart | `cart/` | `InventoryPage`, `CartPage` |
| Checkout | `checkout/` or root until migrated | `CheckoutFlow`, checkout pages |

## Migrating existing specs

`checkout.spec.ts` remains at the test root to avoid churn. When adding more checkout tests, prefer:

```
framework/tests/checkout/checkout.spec.ts
```

Update imports only if relative paths change (aliases stay the same).

## Example files

Skeletons for AI and developers:

- `auth/login.spec.example.ts`
- `inventory/inventory.spec.example.ts`
- `cart/cart.spec.example.ts`

Copy → rename to `*.spec.ts` → uncomment body → add tags.

## CI discovery

Selective PR workflow matches:

`framework/tests/**/*.spec.ts` (nested folders included when specs are added).

Smoke workflow runs `npm run test:smoke` across all projects.
