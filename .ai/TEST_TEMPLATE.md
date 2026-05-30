# Test Template

Canonical pattern for new specs in `framework/tests/`.

```typescript
import { test, expect } from '@playwright/test';
// Prefer fixture when shared setup exists:
// import { test, expect } from '../fixtures/base.fixture';
import { standardUser } from '../data/users';

test.describe('Feature name', () => {
  test('should describe expected outcome @smoke', async ({ page }) => {
    await page.goto('/');

    // Arrange — use pages/fixtures as they are added
    // const loginPage = new LoginPage(page);
    // await loginPage.login(standardUser.username, standardUser.password);

    // Act

    // Assert
    await expect(page).toHaveURL(/expected-path/);
  });
});
```

## Guidelines

- One primary behavior per test
- Use `framework/data/` for users and test inputs
- Use Page Objects for interactions; avoid raw locators in specs when a page exists
- Tag tests (`@smoke`, `@critical`) when useful for selective runs
