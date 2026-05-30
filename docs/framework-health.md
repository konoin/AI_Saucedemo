# Framework Health Report

**Status:** Enterprise-ready foundation (mature scaffold, small suite)  
**Last updated:** Framework hardening pass

---

## Current architecture

| Layer | Location | Status |
|-------|----------|--------|
| Tests | `framework/tests/` | 1 active spec + domain folders |
| Flows | `framework/flows/` | Login, checkout |
| Fixtures | `framework/fixtures/base.fixture.ts` | 5 page fixtures |
| Pages | `framework/pages/` | 5 pages |
| Selectors | `framework/constants/selectors.ts` | `Selectors` + legacy exports |
| Data | `framework/data/` | Users, checkout customer |
| Types | `framework/types/` | Barrel `@types` |
| Reporters | `framework/reporters/ai-reporter.ts` | `test-results/ai-report.json` |
| AI | `.ai/` | Context, patterns, templates, prompts |
| CI | `.github/workflows/` | Selective regression + smoke |

---

## Page Objects

| Page | Responsibility |
|------|----------------|
| `LoginPage` | Authentication |
| `InventoryPage` | Catalog, add to cart, open cart |
| `CartPage` | Proceed to checkout |
| `CheckoutPage` | Shipping form, continue, finish |
| `CheckoutCompletePage` | Order confirmation assertion helper |

---

## Fixtures

`base.fixture.ts` injects all page objects. Specs should import `test` / `expect` from `@fixtures/base.fixture`.

---

## Flows

| Flow | Method |
|------|--------|
| `LoginFlow` | `loginAs(user)` |
| `CheckoutFlow` | `completeOrder(customer)` |

Flows orchestrate pages only — **no assertions**.

---

## Selectors

Single registry: `Selectors.login | inventory | cart | checkout`.

Backward-compatible: `loginSelectors`, etc.

---

## CI

| Workflow | Trigger | Scope |
|----------|---------|-------|
| `ai-regression.yml` | PR → `main` | Changed `*.spec.ts` only |
| `smoke.yml` | Push `main`, manual | `@smoke` via `npm run test:smoke` |

**Artifacts:** HTML report, console log, `test-results/` (traces, screenshots, `ai-report.json`).

---

## MCP

- Cursor: `.cursor/mcp.json` (Playwright MCP)
- Workflow doc: `docs/mcp-locator-workflow.md`
- Rules: `.ai/MCP_GUIDE.md`, `.cursor/rules/`

---

## AI templates

| Template | Path |
|----------|------|
| Page | `.ai/templates/page.template.ts` |
| Fixture | `.ai/templates/fixture.template.ts` |
| Test | `.ai/templates/test.template.ts` |
| Flow | `.ai/templates/flow.template.ts` |

Plus markdown templates in `.ai/*_TEMPLATE.md`.

---

## Reporting

| Output | Path | Consumer |
|--------|------|----------|
| HTML | `playwright-report/` | Humans |
| JSON | `playwright-report/results.json` | Scripts |
| AI summary | `test-results/ai-report.json` | Agents, dashboards |

---

## Known limitations

1. **Small suite** — one E2E test; folders are preparatory
2. **`checkout.spec.ts` at test root** — not yet under `checkout/` subfolder
3. **No API layer** — UI-only (by design)
4. **Smoke workflow runs all browser projects** — may be slow; consider `--project=chromium` later
5. **`CheckoutCompletePage` contains `expect()`** — acceptable for Assert phase; flows stay clean
6. **`@types` path** — TypeScript reserves `@types/*`; use `@types` barrel import
7. **Example specs** — commented; must rename to `.spec.ts` to execute

---

## Future roadmap

| Priority | Item |
|----------|------|
| High | Add auth + inventory specs from `.example.ts` skeletons |
| High | PR comment bot consuming `ai-report.json` |
| Medium | Move `checkout.spec.ts` → `checkout/checkout.spec.ts` |
| Medium | Component objects (header, cart badge) |
| Medium | Chromium-only smoke job for speed |
| Low | Shard-ready CI matrix |
| Low | Visual regression (if product requires) |

---

## Health checks

```bash
npm run typecheck
npm test
npm run test:smoke
```

Review `test-results/ai-report.json` after each run.
