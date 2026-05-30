# Getting Started

## Prerequisites

- Node.js 20+
- npm

## Install

```bash
npm ci
npx playwright install
```

## Run tests

```bash
npm test
```

UI mode:

```bash
npm run test:ui
```

Typecheck:

```bash
npm run typecheck
```

## Project layout

- `framework/tests/` — Playwright specs
- `framework/pages/` — Page Objects
- `framework/constants/selectors.ts` — locator registry
- `framework/data/users.ts` — test users
- `.ai/` — AI context and templates
- `.cursor/mcp.json` — Playwright MCP for Cursor

## Writing a new test

1. Read `.ai/TEST_TEMPLATE.md`
2. Add selectors to `framework/constants/selectors.ts` if needed
3. Add or extend a Page Object (`.ai/PAGE_TEMPLATE.md`)
4. Create spec under `framework/tests/`

## Playwright MCP (Cursor)

1. Ensure `.cursor/mcp.json` is present
2. Read `.ai/MCP_GUIDE.md` for explore → register → implement workflow
3. Target app: https://www.saucedemo.com

## CI

Pull requests to `main` trigger selective regression when files under `framework/tests/` change. See `docs/architecture.md`.
