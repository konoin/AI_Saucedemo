# Fixture Template

Canonical pattern for extending Playwright fixtures in `framework/fixtures/`.

```typescript
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { standardUser } from '../data/users';

type MyFixtures = {
  loginPage: LoginPage;
  authenticatedPage: void;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  authenticatedPage: async ({ loginPage, page }, use) => {
    await loginPage.login(standardUser.username, standardUser.password);
    await use();
  },
});

export { expect } from '@playwright/test';
```

## Usage in specs

```typescript
import { test, expect } from '../fixtures/base.fixture';

test('example with loginPage fixture', async ({ loginPage, page }) => {
  await loginPage.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/inventory/);
});
```

## Guidelines

- Extend `base.fixture.ts` or replace imports gradually — do not break existing specs until migrated
- Fixtures own **setup**; specs own **assertions**
- Reuse `framework/data/users.ts` for credentials
