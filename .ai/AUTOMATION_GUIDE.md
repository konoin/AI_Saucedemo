# Cursor Automation Guide

How AI agents should add code to this framework without breaking conventions.

---

## Workflow overview

```
Feature request
      ↓
Selector Registry (framework/constants/selectors.ts)
      ↓
Page Object (framework/pages/)
      ↓
Flow — if journey repeats (framework/flows/)
      ↓
Test (framework/tests/<domain>/)
```

Optional: extend `base.fixture.ts` when a new Page Object needs fixture injection.

---

## Step 1 — Selectors

**File:** `framework/constants/selectors.ts`

1. Search `Selectors` for existing keys
2. Add under correct namespace: `login`, `inventory`, `cart`, `checkout`
3. Use Sauce Demo `data-test` values only

```typescript
export const Selectors = {
  inventory: {
    // existing keys...
    newAction: 'data-test-value',
  },
} as const;
```

Do not add locators in pages, flows, or tests without registering here first.

---

## Step 2 — Page Object

**Folder:** `framework/pages/`  
**Template:** `.ai/templates/page.template.ts`  
**Prompt:** `.ai/PROMPTS/create-page.md`  
**Rules:** `.cursor/rules/pages.mdc`

1. Check if an existing page can be extended
2. One class per screen: `<Screen>Page.ts`
3. Import `Selectors` from `@constants/selectors`
4. Atomic methods only — no multi-step journeys
5. No `expect()` (except established completion-page pattern)

---

## Step 3 — Flow (when needed)

**Folder:** `framework/flows/`  
**Template:** `.ai/templates/flow.template.ts`  
**Prompt:** `.ai/PROMPTS/create-flow.md`  
**Rules:** `.cursor/rules/flows.mdc`

Create a flow when:

- The same 2+ page sequence appears in multiple specs
- A test would otherwise duplicate orchestration

Reuse `LoginFlow` and `CheckoutFlow` before creating new flows.

---

## Step 4 — Fixture (when needed)

**File:** `framework/fixtures/base.fixture.ts`  
**Template:** `.ai/templates/fixture.template.ts`

Only extend fixtures when a new Page Object should be injected into every spec:

```typescript
newPage: async ({ page }, use) => {
  await use(new NewPage(page));
},
```

Existing fixtures: `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage`, `checkoutCompletePage`.

---

## Step 5 — Test

**Folder:** `framework/tests/<domain>/`  
**Template:** `.ai/templates/test.template.ts`  
**Prompt:** `.ai/PROMPTS/create-test.md`  
**Rules:** `.cursor/rules/tests.mdc`

1. Import `test`, `expect` from `@fixtures/base.fixture`
2. Import data from `@data/*`
3. Instantiate flows in spec body
4. Tags: `@smoke`, `@regression`, `@critical`
5. Arrange → Act → Assert
6. No `page.locator()` in specs

**Canonical reference:** `framework/tests/checkout.spec.ts`

---

## Checklist before finishing

- [ ] Searched existing pages, flows, selectors
- [ ] No duplicated locators or journey logic
- [ ] `npm run typecheck` passes
- [ ] `npx playwright test` passes for affected specs
- [ ] Tags applied if spec is new
- [ ] Did not modify CI, MCP, or folder structure

---

## Related docs

| Doc | Purpose |
|-----|---------|
| `.ai/KNOWN_PATTERNS.md` | Real code patterns |
| `.ai/CONTEXT.md` | Project overview |
| `docs/mcp-locator-workflow.md` | MCP → selector workflow |
| `docs/test-organization.md` | Spec folder strategy |
| `.cursor/rules/*.mdc` | Cursor enforcement |
