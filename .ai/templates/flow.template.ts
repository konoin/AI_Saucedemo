import { ExamplePage } from '@pages/ExamplePage';

/**
 * Canonical flow template.
 * Copy to framework/flows/<name>.flow.ts
 *
 * Rules: orchestrate Page Objects only — no assertions.
 */
export class ExampleFlow {
  constructor(private readonly examplePage: ExamplePage) {}

  async runExampleWorkflow(input: string) {
    await this.examplePage.performPrimaryAction(input);
  }
}
