# Prompt: Create Page Object

You are adding a Page Object to the **AI_Saucedemo** framework.

## Before writing code

1. Check `framework/pages/` for an existing page to extend
2. Check `framework/constants/selectors.ts` — add keys first if missing
3. Read `.cursor/rules/pages.mdc`

## Rules

- File: `framework/pages/<Screen>Page.ts`
- Import selectors: `Selectors` or legacy `*Selectors` from `@constants/selectors`
- Use `getByTestId()` only (Sauce Demo `data-test`)
- **Atomic methods** — one action per method
- **No assertions**, **no flows**, **no business journeys**
- Prefer `readonly` locators in constructor when shared
- Forbidden: XPath, nth-child, brittle CSS

## Do not create

- `completeCheckout()`-style methods → use `framework/flows/`
- Duplicate `LoginPage` / `InventoryPage` logic

## Template

Copy `.ai/templates/page.template.ts`.

## Output

Provide:

1. New or extended page file
2. Selectors added to `selectors.ts` (if any)
3. List of public methods

Do not modify tests unless explicitly asked.
