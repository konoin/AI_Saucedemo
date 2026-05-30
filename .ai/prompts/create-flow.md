# Prompt: Create Flow

You are adding a business Flow to the **AI_Saucedemo** framework.

## Before writing code

1. Read `framework/flows/login.flow.ts` and `framework/flows/checkout.flow.ts`
2. Confirm the journey is not already covered by `LoginFlow` or `CheckoutFlow`
3. Confirm page methods exist in `framework/pages/`

## Rules

- File: `framework/flows/<feature>.flow.ts`
- Class: `<Feature>Flow`
- Constructor receives **Page Objects only** — not raw `Page`
- Orchestrate existing page methods
- **No locators**
- **No assertions**
- Import types from `@types`, data from `@data/*` when needed

## Template

Copy `.ai/templates/flow.template.ts`.

## Output

Provide:

1. Flow file path
2. Pages orchestrated
3. Which specs should call this flow

Do not duplicate flow steps inside tests or pages.
