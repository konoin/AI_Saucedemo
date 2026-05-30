# Project Rules

## Stack and patterns

- Use **Playwright** (`@playwright/test`) for all automation
- Use **TypeScript** for framework and test code
- Use **Page Object Model** — UI logic belongs in `framework/pages/` and `framework/components/`
- Prefer **fixtures** (`framework/fixtures/`) for shared setup (auth, pages, flows)
- Keep specs **thin** — scenario steps only, no duplicated locator strings

## Locators

- Use **`getByTestId()`** with keys from `framework/constants/selectors.ts`
- Sauce Demo uses **`data-test`** (configured via `testIdAttribute` in Playwright config)
- **Avoid XPath**
- Avoid unstable CSS classes and long selector chains

## Waits and stability

- **No hardcoded waits** (`page.waitForTimeout`) unless documented and justified
- Rely on Playwright auto-waiting and web-first assertions
- Use `expect` with built-in retries

## Data and secrets

- Store users and test data in **`framework/data/`**
- Do not hardcode credentials in spec files

## Scope

- **No API layer** until explicitly requested
- Do not remove or skip existing tests without approval
- Preserve **`.cursor/mcp.json`** Playwright MCP configuration

## File placement

| Kind | Location |
|------|----------|
| Specs | `framework/tests/` |
| Pages | `framework/pages/` |
| Components | `framework/components/` |
| Fixtures | `framework/fixtures/` |
| Selectors | `framework/constants/` |
| Data | `framework/data/` |
| Types | `framework/types/` |
| Helpers / flows | `framework/helpers/` |
