# Testing Strategy

## Test layers

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Specs | `framework/tests/` | Tags, assertions, scenario wiring |
| Flows | `framework/flows/` | Multi-step business journeys (no assertions) |
| Pages | `framework/pages/` | Screen actions and locators |
| Data | `framework/data/` | Users, customers, constants |
| Fixtures | `framework/fixtures/` | Inject pages into tests |

## Tagging rules

Tags are declared in the test title using `@tag` syntax.

| Tag | Purpose | When to use |
|-----|---------|-------------|
| `@smoke` | Minimal fast check | Core happy paths, run on every PR when included in changed tests |
| `@regression` | Standard regression | Features that should run in selective/full regression |
| `@critical` | Business-critical | Revenue/auth/checkout paths that must not break |

A test may have multiple tags (e.g. `@critical @smoke @regression`).

### Examples

```typescript
test('@smoke @regression login shows inventory', async ({ ... }) => { ... });
test('@critical @regression checkout completes', async ({ ... }) => { ... });
```

## Suites

### Smoke suite

**Command:** `npm run test:smoke`

**Intent:** Fast feedback on the most important paths.

**Current coverage:** Checkout happy path (tagged `@smoke`).

### Regression suite

**Command:** `npm run test:regression`

**Intent:** Broader coverage for release confidence.

**Current coverage:** All tests tagged `@regression`.

### Critical flows

**Command:** `npm run test:critical`

**Intent:** Non-negotiable business journeys.

**Current coverage:** End-to-end checkout (`@critical`).

## CI alignment

Pull requests run **only changed** specs under `framework/tests/` (see `docs/ci-debugging.md`). Tags help filter locally; CI does not yet filter by tag unless you add a separate workflow later.

## Writing new tests

1. Copy `.ai/templates/test.template.ts`
2. Apply appropriate tags
3. Use flows for repeated journeys
4. Keep assertions in the spec
5. Run `npm test` or targeted tag commands before push
