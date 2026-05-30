# Project Context

**Read time:** ~3 minutes. This is the primary onboarding doc for AI agents.

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
framework/reporters/   → AI machine-readable output
```

**Dependency direction:** tests → flows → pages → selectors. Data/types are imported anywhere needed.

### Quick start (60 seconds)

1. Read `.ai/KNOWN_PATTERNS.md` for auth + checkout
2. Add selectors → page → flow (if reused) → spec in `framework/tests/<domain>/`
3. Import `test` from `@fixtures/base.fixture`; tag with `@smoke` / `@regression` / `@critical`
4. Run `npm test`; inspect `test-results/ai-report.json`

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

## Test folder strategy

| Folder | Domain |
|--------|--------|
| `framework/tests/auth/` | Login, session |
| `framework/tests/inventory/` | Catalog, add to cart |
| `framework/tests/cart/` | Cart behavior |
| `framework/tests/checkout/` | Future checkout specs |
| `framework/tests/*.spec.ts` | Root-level specs (e.g. current checkout) |

Skeletons: `*.spec.example.ts` (not executed). See `docs/test-organization.md`.

---

## Flow strategy

- Use **flows** when ≥2 pages are orchestrated or setup repeats across specs
- **No assertions** in flows — only in specs
- Instantiate in spec: `new LoginFlow(loginPage)`, `new CheckoutFlow(...)`

---

## Tagging strategy

| Tag | Command | Use |
|-----|---------|-----|
| `@smoke` | `npm run test:smoke` | Fast PR/main confidence |
| `@regression` | `npm run test:regression` | Standard regression |
| `@critical` | `npm run test:critical` | Business-critical |

Place tags in the **test title**. Multiple tags allowed.

Docs: `docs/testing-strategy.md`

---

## Reporting strategy

| Output | Path |
|--------|------|
| Human HTML | `playwright-report/` |
| Playwright JSON | `playwright-report/results.json` |
| **AI summary** | `test-results/ai-report.json` |

AI reporter captures: name, status, duration, tags, retries, project.  
Custom reporter: `framework/reporters/ai-reporter.ts` (does not replace HTML/JSON).

---

## Testing strategy

- Structure: **Arrange → Act → Assert**
- Specs: `framework/tests/**/*.spec.ts`

```bash
npm test              # all
npm run test:smoke    # @smoke
npm run test:regression
npm run test:critical
```

---

## CI

| Workflow | When | What |
|----------|------|------|
| `ai-regression.yml` | PR → `main` | Changed specs only |
| `smoke.yml` | Push `main`, manual | `npm run test:smoke` |

**Artifacts:** `playwright-report`, `test-results` (traces, screenshots, `ai-report.json`), `playwright-output` (regression log).

Debug: `docs/ci-debugging.md` · MCP locators: `docs/mcp-locator-workflow.md`

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
