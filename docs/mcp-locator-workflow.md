# MCP Locator Workflow

End-to-end process for adding UI coverage using **Playwright MCP** (Cursor) and this framework.

**Prerequisite:** `.cursor/mcp.json` configured (do not modify without approval).

---

## 1. Open MCP

1. Open the project in Cursor
2. Ensure the Playwright MCP server is enabled (`npx @playwright/mcp@latest`)
3. Start a session targeting https://www.saucedemo.com

---

## 2. Explore the application

1. Navigate through the feature under test (e.g. login → inventory)
2. Note interactive elements and their `data-test` attributes (Sauce Demo uses `data-test`, not `data-testid`)
3. Confirm happy path and key edge states (empty cart, error messages)

**Example observation:**

- Username field: `data-test="username"`
- Login button: `data-test="login-button"`

---

## 3. Identify stable selectors

Prefer, in order:

1. `data-test` → `getByTestId('username')` (via `testIdAttribute: 'data-test'` in config)
2. Accessible role + name
3. Avoid XPath and dynamic CSS classes

---

## 4. Add selector to `selectors.ts`

Edit `framework/constants/selectors.ts`:

```typescript
export const Selectors = {
  login: {
    username: 'username',
    // add newKey: 'data-test-value',
  },
  // ...
} as const;
```

Legacy aliases (`loginSelectors`, etc.) update automatically when they reference `Selectors`.

---

## 5. Update Page Object

Edit or create `framework/pages/<Screen>Page.ts`:

```typescript
import { Selectors } from '@constants/selectors';

await this.page.getByTestId(Selectors.login.username).fill(value);
```

No assertions in pages (except established completion helpers used from specs).

Template: `.ai/templates/page.template.ts`

---

## 6. Create or extend a test

1. Copy `.ai/templates/test.template.ts` or a `*.spec.example.ts` skeleton
2. Place under the correct folder (`docs/test-organization.md`)
3. Use fixtures + flows; tags: `@smoke` / `@regression` / `@critical`
4. **Assert only in the spec**

```typescript
import { test, expect } from '@fixtures/base.fixture';
import { LoginFlow } from '@flows/login.flow';

test('@smoke @regression user logs in', async ({ page, loginPage }) => {
  await new LoginFlow(loginPage).loginAs(standardUser);
  await expect(page).toHaveURL(/inventory/);
});
```

---

## 7. Run the test

```bash
npx playwright test path/to/spec.ts --project=chromium
# or
npm test
```

Check:

- `playwright-report/index.html`
- `test-results/ai-report.json` (machine-readable summary)

---

## 8. Review trace on failure

```bash
npx playwright show-trace test-results/.../trace.zip
```

Config retains trace, screenshot, and video on failure (`playwright.config.ts`).

On CI, download the `test-results` artifact from GitHub Actions.

---

## Full example: add “logout” (hypothetical)

| Step | Action |
|------|--------|
| MCP | Confirm `data-test="logout-sidebar-link"` |
| Registry | Add `logout: 'logout-sidebar-link'` under new or existing namespace |
| Page | `HeaderComponent.clickLogout()` or `InventoryPage.logout()` |
| Test | `auth/logout.spec.ts` with `@regression` |
| Run | `npx playwright test framework/tests/auth/logout.spec.ts` |

---

## Related docs

- `.ai/MCP_GUIDE.md` — MCP principles
- `.ai/KNOWN_PATTERNS.md` — auth & checkout patterns
- `docs/ci-debugging.md` — CI artifacts
