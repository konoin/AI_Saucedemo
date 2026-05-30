# Page Object Template

Canonical pattern for `framework/pages/<Name>Page.ts`.

```typescript
import { Page, Locator } from '@playwright/test';
import { loginSelectors } from '../constants/selectors';

export class ExamplePage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId(loginSelectors.username);
  }

  async goto() {
    await this.page.goto('/path');
  }

  async performAction(value: string) {
    await this.page.getByTestId(loginSelectors.username).fill(value);
  }
}
```

## Guidelines

- Import selector keys from `framework/constants/selectors.ts`
- Use `getByTestId()` for Sauce Demo `data-test` attributes
- Expose **actions** (methods), not test assertions
- Keep `constructor(private readonly page: Page)`
- Navigation uses `baseURL` — prefer `page.goto('/')` or relative paths
