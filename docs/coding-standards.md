# Coding Standards

## TypeScript

- Strict mode enabled (`tsconfig.json`)
- Prefer `readonly` constructor dependencies in Page Objects
- Export types from `framework/types/`; avoid duplicate interfaces

## Locators

- Register `data-test` keys in `framework/constants/selectors.ts`
- Use `page.getByTestId(key)` in pages and components
- Do not use XPath
- Avoid `page.waitForTimeout()` — use Playwright auto-wait and `expect`

## Page Objects

- File name: `<Screen>Page.ts`, class name: `<Screen>Page`
- No assertions inside pages
- Navigation via relative URLs when possible (`/`)

## Tests

- File name: `<feature>.spec.ts`
- Descriptive `test('...')` titles
- Import users from `framework/data/users.ts`
- Migrate to fixtures incrementally (`framework/fixtures/base.fixture.ts`)

## Formatting

- Prettier default (see editor settings in `.vscode/settings.json`)
- Run `npm run typecheck` before pushing

## AI-generated code

- Follow `.ai/PROJECT_RULES.md` and `.cursor/rules/`
- Use templates in `.ai/*_TEMPLATE.md`
- After MCP exploration, update `selectors.ts` before merging
