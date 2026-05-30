# Project Context

## Project name

AI_Saucedemo — AI-ready Playwright automation framework.

## Framework stack

- **Playwright** (`@playwright/test`) — browser automation and test runner
- **TypeScript** — framework code and tests
- **Page Object Model (POM)** — UI abstraction in `framework/pages/`
- **Component objects** — reusable UI pieces in `framework/components/` (as needed)
- **Fixtures** — shared setup in `framework/fixtures/`
- **Cursor + Playwright MCP** — exploration, locator validation, debugging

## Application under test

- **Sauce Demo**: https://www.saucedemo.com
- Public demo e-commerce site (login, inventory, cart, checkout)
- `baseURL` and `testIdAttribute: data-test` are set in `playwright.config.ts`

## Locator strategy

1. Prefer **`getByTestId()`** — maps to `data-test` on Sauce Demo
2. Centralize keys in **`framework/constants/selectors.ts`**
3. Use **role-based** locators when semantic and stable
4. **Avoid XPath** and brittle CSS class chains
5. Do not add locators inline in specs long-term — use pages/components

## Testing strategy

- E2E specs live in **`framework/tests/`**
- Credentials and test data in **`framework/data/`**
- Critical flows: login → inventory → cart → checkout → confirmation
- CI runs **selective regression** on changed specs (see `.github/workflows/ai-regression.yml`)
- New tests: follow templates in `.ai/TEST_TEMPLATE.md`, `.ai/PAGE_TEMPLATE.md`, `.ai/FIXTURE_TEMPLATE.md`
- AI playbooks for generation/analysis: **`.ai/prompts/`**
