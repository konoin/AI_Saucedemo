# AI_Saucedemo

AI-ready Playwright automation framework for [Sauce Demo](https://www.saucedemo.com).

Built for human maintainers and AI-assisted development (Cursor, Playwright MCP). The framework separates UI actions, business journeys, test data, and assertions so tests stay thin, locators stay centralized, and CI can run selective, smoke, and full regression pipelines.

---

## Project Overview

### Purpose

This repository provides an end-to-end UI automation framework that demonstrates modern Playwright + TypeScript practices with first-class support for:

- **Page Object Model (POM)** — screen-level UI abstractions
- **Flows** — reusable multi-step business journeys
- **Fixtures** — injected page objects and shared setup
- **Selector registry** — single source of truth for `data-test` keys
- **AI context** — documentation, templates, and Cursor rules for consistent codegen
- **CI/CD** — selective PR regression, smoke on `main`, nightly regression, Telegram notifications

### Application Under Test

| Item | Value |
|------|--------|
| App | [Sauce Demo](https://www.saucedemo.com) |
| Type | Public demo e-commerce site |
| Critical flows | Login → inventory → cart → checkout → order confirmation |
| Locator attribute | `data-test` (configured as `testIdAttribute` in Playwright) |

### Framework Goals

- Keep tests readable and maintainable (Arrange → Act → Assert)
- Enable AI agents to extend the framework without duplicating locators or journeys
- Provide fast PR feedback (changed specs only, Chromium)
- Support tagged suites (`@smoke`, `@regression`, `@critical`)
- Retain debugging artifacts on failure (trace, screenshot, video, AI JSON report)

---

## Technology Stack

| Technology | Role in this project |
|------------|----------------------|
| [Playwright](https://playwright.dev/) | Test runner, browser automation |
| TypeScript | Framework and spec language |
| [Cursor](https://cursor.com/) | AI IDE with project rules (`.cursor/rules/`) |
| [Playwright MCP](https://www.npmjs.com/package/@playwright/mcp) | Browser exploration and locator validation in Cursor |
| GitHub Actions | CI: selective regression, smoke, nightly regression |
| Telegram | Optional notifications via `telegram-notify.yml` |
| ESLint / Prettier | Linting and formatting (dev dependencies) |

---

## Framework Architecture

The framework uses a layered design. Dependencies flow **downward** — tests use flows and fixtures; flows use pages; pages use selectors.

```
┌─────────────────────────────────────────────────────────┐
│  framework/tests/          Specs, tags, assertions      │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  framework/flows/          Business journeys (no assert)│
│  framework/fixtures/       Playwright fixture extensions│
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  framework/pages/          Page Objects (UI actions)    │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  framework/constants/      Selector registry (Selectors)│
│  framework/data/           Users, checkout data         │
│  framework/types/          TypeScript interfaces        │
└─────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Pages** | `framework/pages/` | Locators and atomic UI actions |
| **Flows** | `framework/flows/` | Orchestrate pages for reusable journeys |
| **Fixtures** | `framework/fixtures/` | Inject page objects into tests |
| **Data** | `framework/data/` | Credentials and test inputs |
| **Constants** | `framework/constants/` | `Selectors` registry |
| **Tests** | `framework/tests/` | Scenarios, tags, assertions |
| **Types** | `framework/types/` | Shared TypeScript types |
| **Reporters** | `framework/reporters/` | Custom AI JSON reporter |

---

## Project Structure

```
AI_Saucedemo/
├── .ai/                          # AI agent context, prompts, templates
│   ├── CONTEXT.md
│   ├── PROJECT_RULES.md
│   ├── MCP_GUIDE.md
│   ├── KNOWN_PATTERNS.md
│   ├── AUTOMATION_GUIDE.md
│   ├── prompts/                  # AI playbooks (create-test, regression, etc.)
│   └── templates/                # Code templates (page, flow, test, fixture)
├── .cursor/
│   ├── mcp.json                  # Playwright MCP server config
│   └── rules/                    # Cursor enforcement rules (*.mdc)
├── .github/workflows/
│   ├── ai-regression.yml         # PR selective regression
│   ├── smoke.yml                 # Smoke on push to main
│   ├── regression.yml            # Nightly full regression
│   └── telegram-notify.yml       # Telegram notifications
├── docs/                         # Human documentation
├── framework/
│   ├── components/               # Reusable UI fragments (reserved)
│   ├── constants/selectors.ts    # Selector registry
│   ├── data/                     # users.ts, checkout-customer.ts
│   ├── fixtures/base.fixture.ts  # Extended Playwright test
│   ├── flows/                    # login.flow.ts, checkout.flow.ts
│   ├── helpers/                  # Utilities (reserved)
│   ├── pages/                    # Page Objects (5 pages)
│   ├── reporters/ai-reporter.ts  # Machine-readable test summary
│   ├── scripts/                  # CI helper scripts
│   ├── tests/                    # Specs + domain example skeletons
│   └── types/                    # user.ts, checkout-customer.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Playwright Framework Design

### Page Objects

**Location:** `framework/pages/`

**Responsibilities:**

- Encapsulate locators via `getByTestId()` and keys from `Selectors`
- Expose atomic user actions (`login`, `addBackpackToCart`, `proceedToCheckout`, etc.)
- Navigate using `baseURL` (`page.goto('/')`)

**Rules:**

- No business journeys (use Flows)
- No assertions in pages (except `CheckoutCompletePage.expectThankYouMessage`, used from the spec Assert phase)

**Current pages:** `LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`, `CheckoutCompletePage`

### Flows

**Location:** `framework/flows/`

**Responsibilities:**

- Orchestrate multiple Page Objects for reusable business journeys
- Accept typed data (`User`, `CheckoutCustomer`) from the data layer

**Rules:**

- No locators
- No assertions

**Current flows:**

| Flow | Method | Journey |
|------|--------|---------|
| `LoginFlow` | `loginAs(user)` | Authenticate via `LoginPage` |
| `CheckoutFlow` | `completeOrder(customer)` | Backpack → cart → checkout → finish |

### Fixtures

**Location:** `framework/fixtures/base.fixture.ts`

**Responsibilities:**

- Extend Playwright `test` with injected page objects
- Provide a single import for all specs: `@fixtures/base.fixture`

**Injected fixtures:** `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage`, `checkoutCompletePage`

### Tests

**Location:** `framework/tests/`

**Responsibilities:**

- Define business scenarios with tags
- Wire fixtures and flows
- Contain all assertions (`expect`)

**Structure:** Arrange → Act → Assert

**Active spec:** `framework/tests/checkout.spec.ts` — end-to-end checkout happy path

**Example skeletons** (not executed): `auth/`, `inventory/`, `cart/` — `*.spec.example.ts` files ignored by Playwright via `testIgnore`

---

## Locator Strategy

Selectors are centralized in `framework/constants/selectors.ts`:

```typescript
export const Selectors = {
  login: { username: 'username', password: 'password', loginButton: 'login-button' },
  inventory: { shoppingCartLink: 'shopping-cart-link', addToCartBackpack: 'add-to-cart-sauce-labs-backpack' },
  cart: { checkout: 'checkout' },
  checkout: { firstName: 'firstName', lastName: 'lastName', /* ... */ },
} as const;
```

Legacy exports (`loginSelectors`, `inventorySelectors`, etc.) remain for backward compatibility.

### Priority

1. **`getByTestId()`** — maps to Sauce Demo `data-test` attributes
2. **`getByRole()`** — when semantic and stable
3. **`getByLabel()`** — when appropriate

### Forbidden

- XPath
- Unstable CSS class selectors
- `nth-child` / positional CSS
- Inline locators in specs when a Page Object exists

Configure in `playwright.config.ts`:

```typescript
use: {
  baseURL: 'https://www.saucedemo.com',
  testIdAttribute: 'data-test',
}
```

---

## AI-Driven Development

### Cursor

Cursor uses project rules in `.cursor/rules/` to enforce framework conventions on every edit:

| Rule file | Applies to |
|-----------|------------|
| `framework.mdc` | Global — reuse architecture, locator policy |
| `pages.mdc` | `framework/pages/**/*.ts` |
| `flows.mdc` | `framework/flows/**/*.ts` |
| `tests.mdc` | `framework/tests/**/*.ts` |

Start with `.ai/CONTEXT.md` (~3 min read) and `.ai/KNOWN_PATTERNS.md` for real code examples.

### Playwright MCP

Configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Recommended AI Workflow

```
Feature request
      ↓
MCP exploration (live browser on saucedemo.com)
      ↓
Selector discovery → add to framework/constants/selectors.ts
      ↓
Page Object update/create → framework/pages/
      ↓
Flow update/create (if journey repeats) → framework/flows/
      ↓
Test creation → framework/tests/<domain>/
      ↓
Run tests + review test-results/ai-report.json
```

See also: `docs/mcp-locator-workflow.md`, `.ai/MCP_GUIDE.md`, `.ai/AUTOMATION_GUIDE.md`

---

## AI Project Files (`.ai/`)

| File / folder | Purpose |
|----------------|---------|
| `CONTEXT.md` | Project overview for AI agents — architecture, CI, MCP, aliases |
| `PROJECT_RULES.md` | Hard rules: POM, fixtures, locators, no API layer |
| `MCP_GUIDE.md` | How to use Playwright MCP for exploration and debugging |
| `KNOWN_PATTERNS.md` | Real patterns from this repo (pages, flows, fixtures, spec) |
| `AUTOMATION_GUIDE.md` | Step-by-step: selector → page → flow → test |
| `prompts/` | Focused prompts (`create-test`, `create-page`, `create-flow`, regression analysis, etc.) |
| `templates/` | TypeScript templates matching current architecture |

Markdown templates: `TEST_TEMPLATE.md`, `PAGE_TEMPLATE.md`, `FIXTURE_TEMPLATE.md`

---

## Cursor Rules (`.cursor/rules/`)

Cursor rules automatically guide AI-generated code to match this framework:

- **Reuse** existing pages, flows, fixtures, and selectors before creating new ones
- **Enforce** TypeScript-only, Playwright-only, no XPath
- **Separate** concerns: pages = actions, flows = journeys, tests = assertions
- **Forbid** `page.locator()` in specs

Rules use glob patterns so page rules apply only when editing pages, etc.

---

## GitHub Actions

| Workflow | Trigger | Purpose | Scope |
|----------|---------|---------|-------|
| **AI Selective Regression** (`ai-regression.yml`) | PR to `main`, `workflow_dispatch` | Run only **changed** spec files vs `main` | Chromium only (`--project=chromium`) |
| **Smoke Tests** (`smoke.yml`) | Push to `main`, `workflow_dispatch` | Fast confidence | `npm run test:smoke -- --project=chromium` |
| **Nightly Regression** (`regression.yml`) | Daily `02:00 UTC`, `workflow_dispatch` | Full regression tag suite | `npm run test:regression` (all browser projects) |
| **Telegram Notify** (`telegram-notify.yml`) | After test workflows complete, `workflow_dispatch` | Send pass/fail to Telegram | Requires `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` secrets |

### Artifacts

Workflows upload (where applicable):

- `playwright-report/` — HTML report
- `test-results/` — traces, screenshots, videos, `ai-report.json`
- `playwright-output` — console log (selective regression only)

All workflows use **npm caching** via `setup-node` (`cache: npm`).

Debug guide: `docs/ci-debugging.md`

---

## Test Tags

Tags are declared in the **test title** using `@tag` syntax.

| Tag | Purpose | npm script |
|-----|---------|------------|
| `@smoke` | Fast critical-path check | `npm run test:smoke` |
| `@regression` | Standard regression coverage | `npm run test:regression` |
| `@critical` | Business-critical flows | `npm run test:critical` |

### Example

```typescript
test('@critical @smoke @regression successful checkout flow', async ({ ... }) => {
  // ...
});
```

Current checkout test uses all three tags. Multiple tags per test are supported.

Details: `docs/testing-strategy.md`

---

## Running Tests

### Prerequisites

```bash
npm ci
npx playwright install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests (chromium, firefox, webkit) |
| `npm run test:smoke` | Tests tagged `@smoke` |
| `npm run test:regression` | Tests tagged `@regression` |
| `npm run test:critical` | Tests tagged `@critical` |
| `npm run test:ui` | Playwright UI mode |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |

### Examples

```bash
# Single browser (recommended locally)
npx playwright test --project=chromium

# Single file
npx playwright test framework/tests/checkout.spec.ts --project=chromium

# View HTML report
npx playwright show-report

# View trace after failure
npx playwright show-trace test-results/<path>/trace.zip
```

### Reports

| Output | Path |
|--------|------|
| HTML report | `playwright-report/` |
| Playwright JSON | `playwright-report/results.json` |
| AI summary | `test-results/ai-report.json` |

---

## Development Workflow

Recommended flow for new automation:

1. **Create or pick a task** (feature / test case)
2. **Explore with MCP** — verify `data-test` attributes on saucedemo.com
3. **Update selectors** — `framework/constants/selectors.ts`
4. **Update or add Page Object** — `framework/pages/`
5. **Update or add Flow** — if the journey spans multiple pages and repeats
6. **Extend fixture** — only if a new page needs injection (`base.fixture.ts`)
7. **Create test** — `framework/tests/<domain>/`, use tags
8. **Run locally** — `npm run typecheck` + `npx playwright test --project=chromium`
9. **Run smoke** — `npm run test:smoke -- --project=chromium`
10. **Open PR** — triggers selective regression on changed specs
11. **Review CI artifacts** — HTML report, `test-results/`, Telegram notification (if configured)

Copy templates from `.ai/templates/` or prompts from `.ai/prompts/`.

---

## Path Aliases

Configured in `tsconfig.json`:

| Alias | Maps to |
|-------|---------|
| `@pages/*` | `framework/pages/*` |
| `@flows/*` | `framework/flows/*` |
| `@fixtures/*` | `framework/fixtures/*` |
| `@data/*` | `framework/data/*` |
| `@constants/*` | `framework/constants/*` |
| `@types` | `framework/types/index.ts` |

---

## Future AI Roadmap

The following are **planned future enhancements** — not implemented in this repository yet:

| Item | Description |
|------|-------------|
| **Linear integration** | Link test tasks, failures, and PRs to Linear issues |
| **n8n automation** | Orchestrate notifications, reporting, and agent workflows |
| **AI test design** | Generate test scenarios from requirements with human review |
| **Automated regression impact analysis** | Smarter selective runs based on code + test dependency graph |
| **Automated test generation** | End-to-end agent pipeline from MCP exploration to merged specs |

---

## Contribution Guidelines

### Coding standards

- TypeScript strict mode — run `npm run typecheck` before pushing
- Match existing import style and path aliases
- See `docs/coding-standards.md`

### Architecture standards

- **Pages** — atomic UI actions only
- **Flows** — multi-step journeys, no locators or assertions
- **Tests** — thin specs; use fixtures and flows
- **Do not** move or rename top-level `framework/` folders without team agreement
- See `docs/architecture.md`, `.ai/PROJECT_RULES.md`

### Locator standards

- Register all `data-test` keys in `Selectors` before use
- Use `getByTestId()` in Page Objects
- No XPath, no brittle CSS — see `.cursor/rules/framework.mdc`

### Test standards

- Import from `@fixtures/base.fixture`
- Use `@data/*` for credentials and customer data
- Apply tags: `@smoke`, `@regression`, `@critical`
- Structure: Arrange → Act → Assert
- No `page.locator()` in specs
- See `docs/test-organization.md`, `.cursor/rules/tests.mdc`

---

## Documentation Index

| Document | Topic |
|----------|-------|
| `docs/getting-started.md` | Install and first run |
| `docs/architecture.md` | Layer overview |
| `docs/testing-strategy.md` | Tags and suites |
| `docs/test-organization.md` | Spec folder strategy |
| `docs/mcp-locator-workflow.md` | MCP → selector → test workflow |
| `docs/ci-debugging.md` | Investigating CI failures |
| `docs/framework-health.md` | Maturity snapshot and roadmap |
| `.ai/CONTEXT.md` | AI agent onboarding |

---

## License

ISC (see `package.json`).
