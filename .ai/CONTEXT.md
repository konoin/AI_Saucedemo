# Project Context

**Read time:** ~5 minutes. This is the primary onboarding doc for AI agents.

## Project name

**AI_Saucedemo** — AI-ready Playwright framework for [Sauce Demo](https://www.saucedemo.com).

## Framework stack

| Tool | Role |
|------|------|
| Playwright | Test runner, browser automation |
| TypeScript | Framework and spec language |
| Page Object Model | `framework/pages/` |
| Flows | `framework/flows/` — reusable business journeys |
| Fixtures | `framework/fixtures/base.fixture.ts` |
| Selector registry | `framework/constants/selectors.ts` → `Selectors` |
| Data layer | `framework/data/` |
| Cursor rules | `.cursor/rules/` |
| Playwright MCP | `.cursor/mcp.json` |

---

## Framework architecture

```
framework/tests/       → Specs (tags, Arrange/Act/Assert)
framework/flows/       → Business workflows (no assertions)
framework/fixtures/    → Playwright fixture extensions
framework/pages/       → Page Objects (UI actions)
framework/components/  → Reusable UI fragments (when needed)
framework/constants/   → Selectors (single source of truth)
framework/data/        → Users, checkout data
framework/types/       → TypeScript interfaces
framework/helpers/     → Low-level utilities (when needed)
framework/scripts/     → CI helper scripts
```

**Dependency direction:** tests → flows → pages → selectors. Data/types are imported anywhere needed.

---

## Page Objects

- One class per screen in `framework/pages/`
- Use `page.getByTestId()` with keys from `Selectors.<page>`
- **No assertions** in pages except `CheckoutCompletePage.expectThankYouMessage()` (called from spec Assert phase)
- Constructor: `constructor(private readonly page: Page)`

**Existing pages:** `LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`, `CheckoutCompletePage`

Template: `.ai/templates/page.template.ts`

---

## Fixtures

`framework/fixtures/base.fixture.ts` extends Playwright `test` with:

- `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage`, `checkoutCompletePage`

Specs import:

```typescript
import { test, expect } from '@fixtures/base.fixture';
```

Template: `.ai/templates/fixture.template.ts`

---

## Flows

`framework/flows/` orchestrate Page Objects for multi-step journeys.

| Flow | Method | Purpose |
|------|--------|---------|
| `LoginFlow` | `loginAs(user)` | Authenticate |
| `CheckoutFlow` | `completeOrder(customer)` | Backpack → checkout → finish |

**Flows never contain assertions.**

Template: `.ai/templates/flow.template.ts`  
Patterns: `.ai/KNOWN_PATTERNS.md`

---

## Selectors

**Source of truth:** `export const Selectors = { login, inventory, cart, checkout }`

Legacy exports (`loginSelectors`, etc.) remain for backward compatibility.

Add new keys under the correct namespace before using them in pages.

---

## Application under test

- URL: https://www.saucedemo.com (`baseURL` in `playwright.config.ts`)
- Attributes: `data-test` (via `testIdAttribute: 'data-test'`)
- Critical journey: login → add to cart → checkout → order complete

---

## Testing strategy

- Specs: `framework/tests/*.spec.ts`
- Tags: `@smoke`, `@regression`, `@critical` in test titles
- Structure: **Arrange → Act → Assert**
- Docs: `docs/testing-strategy.md`

```bash
npm test              # all
npm run test:smoke    # @smoke
npm run test:regression
npm run test:critical
```

---

## CI

- Workflow: `.github/workflows/ai-regression.yml`
- Triggers: PRs to `main`
- Runs only **changed** specs under `framework/tests/`
- Artifacts: `playwright-output`, `playwright-report`
- Config: retries `2` on CI, `workers: 1`

Debug guide: `docs/ci-debugging.md` (traces/screenshots/video retained on failure locally and in reports).

---

## MCP integration

- Config: `.cursor/mcp.json` — **do not change** without approval
- Guide: `.ai/MCP_GUIDE.md`
- Workflow: explore app → add to `Selectors` → implement page → thin spec

---

## Path aliases (tsconfig)

| Alias | Path |
|-------|------|
| `@pages/*` | `framework/pages/*` |
| `@flows/*` | `framework/flows/*` |
| `@fixtures/*` | `framework/fixtures/*` |
| `@data/*` | `framework/data/*` |
| `@constants/*` | `framework/constants/*` |
| `@types` | `framework/types/index.ts` |

---

## AI resources

| File | Purpose |
|------|---------|
| `.ai/KNOWN_PATTERNS.md` | Auth, checkout, test patterns |
| `.ai/PROJECT_RULES.md` | Hard rules |
| `.ai/templates/*.ts` | Codegen templates |
| `.ai/prompts/` | Regression/risk/flaky playbooks |
| `.cursor/rules/` | Cursor enforcement |

---

## Locator strategy

1. `getByTestId` + `Selectors` registry
2. Role-based locators when appropriate
3. No XPath, no brittle CSS chains
4. No inline locators in specs for production tests

---

## Do not

- Move or rename top-level framework folders
- Change GitHub Actions behavior without explicit request
- Modify `.cursor/mcp.json` without approval
- Add an API layer unless requested
- Put assertions in flows
