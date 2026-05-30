import { test as base } from '@playwright/test';
import { ExamplePage } from '@pages/ExamplePage';

type ExampleFixtures = {
  examplePage: ExamplePage;
};

/**
 * Canonical fixture extension template.
 * Copy to framework/fixtures/ or extend base.fixture.ts.
 */
export const test = base.extend<ExampleFixtures>({
  examplePage: async ({ page }, use) => {
    await use(new ExamplePage(page));
  },
});

export { expect } from '@playwright/test';
