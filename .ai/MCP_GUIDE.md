# Playwright MCP Guide

## Purpose

Playwright MCP lets agents explore the live app, validate locators, and debug failures without guessing selectors.

Configuration: **`.cursor/mcp.json`** (do not remove or rename the `playwright` server entry).

## Locator generation workflow

1. **Explore** — Use MCP to open https://www.saucedemo.com and walk the target flow
2. **Identify** — Prefer elements with `data-test` attributes
3. **Register** — Add stable keys to `framework/constants/selectors.ts` under the correct page group
4. **Implement** — Add or update a Page Object in `framework/pages/` using `getByTestId()`
5. **Spec** — Write a thin test in `framework/tests/` using pages, fixtures, or data from `framework/data/`

## Debugging workflow

1. Reproduce the failure locally: `npm test` or `npx playwright test <file>`
2. Use MCP to inspect the page state at the failing step
3. Compare MCP snapshot with selectors in `selectors.ts` and the Page Object
4. On CI failures, download artifacts (`playwright-report/`, `test-output.txt`)
5. Open trace when available: `npx playwright show-trace <trace.zip>`

## Do not

- Commit one-off class-based locators from exploration (e.g. dynamic CSS) without verification
- Bypass Page Objects for production specs when a page already exists
- Change MCP server config to non-Playwright tools without team agreement

## Related docs

- `.ai/CONTEXT.md` — project overview
- `.ai/PROJECT_RULES.md` — coding rules
- `docs/getting-started.md` — local setup
