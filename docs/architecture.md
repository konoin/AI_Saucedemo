# Architecture

## Overview

AI_Saucedemo is a layered Playwright + TypeScript framework for testing [Sauce Demo](https://www.saucedemo.com). It is optimized for human maintainers and AI-assisted authoring (Cursor, Playwright MCP).

## Layers

```
framework/tests/          → E2E scenarios (assertions, flow)
        ↓
framework/fixtures/       → Shared Playwright fixtures (auth, pages)
        ↓
framework/pages/          → Page Object Model
framework/components/     → Reusable UI fragments (cart, header, etc.)
        ↓
framework/constants/      → Selector registry (data-test keys)
framework/data/           → Users and test inputs
framework/types/          → TypeScript interfaces
framework/helpers/        → Multi-step flows (when needed)
```

## Supporting directories

| Path | Role |
|------|------|
| `.ai/` | Agent context, rules, templates, prompts |
| `.cursor/rules/` | Cursor enforcement of conventions |
| `docs/` | Human-readable documentation |
| `framework/scripts/` | CI helpers (changed tests, report summary) |
| `.github/workflows/` | Selective PR regression |

## Configuration

- **`playwright.config.ts`** — `testDir`, `baseURL`, `testIdAttribute: data-test`, reporters, projects
- **`tsconfig.json`** — TypeScript checking for framework code

## CI

`ai-regression.yml` runs Playwright only for specs changed under `framework/tests/` on pull requests to `main`.

## Design principles

- Thin specs, fat pages (gradual migration)
- Single selector registry
- No API layer until required
- MCP-friendly `data-test` locators
