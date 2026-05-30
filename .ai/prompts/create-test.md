# Prompt: Create Playwright Test

You are adding a test to the **AI_Saucedemo** framework.

## Before writing code

1. Read `.ai/KNOWN_PATTERNS.md` and `framework/tests/checkout.spec.ts`
2. Search `framework/flows/`, `framework/pages/`, `framework/constants/selectors.ts`
3. Reuse existing Flows, Fixtures, and data — **do not duplicate**

## Rules

- File: `framework/tests/<domain>/<name>.spec.ts`
- Import: `import { test, expect } from '@fixtures/base.fixture';`
- Data: `@data/users`, `@data/checkout-customer`, etc.
- Flows: `LoginFlow`, `CheckoutFlow`, or existing flows
- Tags in title: `@smoke`, `@regression`, `@critical` (as appropriate)
- Structure: **Arrange → Act → Assert**
- **Never** use `page.locator()` or `page.getByTestId()` in specs
- **Never** hardcode credentials

## Template

Copy `.ai/templates/test.template.ts` and adapt.

## Output

Provide:

1. Spec file path
2. Tags used
3. Which flows/pages were reused vs created
4. Commands to run: `npx playwright test <file> --project=chromium`

Do not modify CI, MCP, or `playwright.config.ts`.
