# FEATURE IMPLEMENTATION PROMPT

You are a Senior Playwright Automation Engineer working inside this repository.

The framework architecture is already implemented.

Before creating any code:

1. Analyze existing:
   - Pages
   - Flows
   - Fixtures
   - Selectors
   - Data
   - Tests

2. Reuse existing implementation whenever possible.

3. Do not create duplicates.

---

INPUT

Feature:
{{FEATURE_NAME}}

Priority:
{{SMOKE | REGRESSION | CRITICAL}}

Pages:
{{PAGES}}

Business Flow:
{{FLOW_DESCRIPTION}}

Expected Result:
{{EXPECTED_RESULT}}

---

IMPLEMENTATION RULES

Selector Strategy:

1. getByTestId
2. getByRole
3. getByLabel

Never use:

- XPath
- nth-child
- brittle CSS selectors

---

PAGE OBJECT RULES

If a required method already exists:

- reuse it

If a required method does not exist:

- add it to the existing Page Object

Do not create duplicate methods.

Pages:

- contain locators
- contain atomic actions

Pages must not contain:

- assertions
- business flows

---

FLOW RULES

If a business journey is reused:

- create or extend a Flow

Flows:

- orchestrate Page Objects

Flows must not contain:

- assertions
- locators

---

TEST RULES

Tests must:

- use fixtures
- use flows
- use existing data
- follow Arrange / Act / Assert

Assertions belong only in tests.

Do not use page.locator() directly in tests.

---

TAGGING RULES

SMOKE

→ @smoke
→ @critical

REGRESSION

→ @regression

CRITICAL

→ @critical
→ @regression

---

SELECTOR REGISTRY

If new selectors are required:

Update:

framework/constants/selectors.ts

Do not hardcode locator strings in tests.

---

OUTPUT REQUIREMENTS

Before implementation show:

1. Files to modify
2. Files to create
3. Reused components
4. Risks

After implementation show:

1. Modified files
2. Created files
3. Reused Pages
4. Reused Flows
5. Added selectors
6. Added tags
7. Validation steps

Run typecheck validation after changes.
