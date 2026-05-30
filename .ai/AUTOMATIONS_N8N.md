# Cursor + n8n AI QA Automation Rules

## Purpose

This repository supports an AI-driven QA workflow using:

- Cursor
- Playwright
- Playwright MCP
- GitHub Actions
- n8n
- Linear (optional)

The objective is to automatically transform requirements into:

1. Test Cases
2. Automated Playwright Tests
3. Regression-ready code

while maintaining human approval gates.

---

# Workflow Overview

Requirement
↓
.ai/tasks/incoming/
↓
Cursor Automation
↓
Generate Test Cases
↓
.ai/tasks/generated/test-cases/
↓
Human Review
↓
.ai/tasks/approved/test-cases/
↓
Cursor Automation
↓
Generate Playwright Tests
↓
.ai/tasks/generated/auto-tests/
↓
Human Review
↓
.ai/tasks/approved/auto-tests/
↓
Developer Merge
↓
GitHub Actions
↓
Smoke / Regression

---

# General Rules

Always:

- Use TypeScript
- Use Playwright
- Follow existing framework architecture
- Reuse existing code before creating new code
- Follow POM pattern
- Follow Flow pattern
- Follow Fixture pattern
- Follow Selector Registry pattern

Never:

- Create duplicate pages
- Create duplicate flows
- Create duplicate fixtures
- Create duplicate selectors
- Use XPath
- Use hardcoded waits
- Use CSS class selectors if testId exists
- Modify GitHub workflows unless explicitly requested

---

# Stage 1 — Requirement Analysis

Trigger:

New file appears:

.ai/tasks/incoming/

Example:

requirement.md

Task:

Analyze the requirement and generate test cases.

Output folder:

.ai/tasks/generated/test-cases/

Naming:

TC-001.md
TC-002.md
TC-003.md

Format:

# TC-001

## Title

## Objective

## Preconditions

## Test Data

## Steps

1.
2.
3.

## Expected Result

## Priority

Critical | High | Medium | Low

---

Generate one file per test case.

Never generate automated tests at this stage.

---

# Stage 2 — Test Case Approval

Trigger:

Files exist in:

.ai/tasks/approved/test-cases/

Task:

Read approved test cases.

Generate Playwright automation.

Output:

.ai/tasks/generated/auto-tests/

Naming:

TC-001.spec.ts
TC-002.spec.ts

---

# Stage 3 — Auto Test Creation

Before creating a test:

Check:

framework/pages/
framework/flows/
framework/fixtures/
framework/constants/selectors.ts

Reuse existing implementation whenever possible.

Priority:

Selectors
↓
Pages
↓
Flows
↓
Fixtures
↓
Tests

---

# Selector Rules

Before adding a selector:

Check:

framework/constants/selectors.ts

If selector exists:

Reuse it.

If selector does not exist:

Add it to the registry.

Never place raw selectors in tests.

---

# Page Object Rules

Pages:

framework/pages/

Pages may contain:

- Locators
- UI actions

Pages must not contain:

- Assertions
- Business logic

---

# Flow Rules

Flows:

framework/flows/

Flows may contain:

- Multi-page journeys
- Business actions

Flows must not contain:

- Assertions
- Locators

---

# Fixture Rules

Fixtures:

framework/fixtures/

Use existing fixtures first.

Create new fixtures only if absolutely necessary.

---

# Test Rules

Tests:

framework/tests/

Tests should contain:

Arrange
Act
Assert

Tests should be thin.

Assertions belong only in tests.

---

# MCP Usage

When UI interaction is unclear:

Use Playwright MCP.

Workflow:

Requirement
↓
MCP Exploration
↓
Identify data-test attributes
↓
Update selectors.ts
↓
Update Pages
↓
Update Flows
↓
Generate Tests

Never generate selectors blindly.

---

# Traceability

Every generated test must include:

/\*\*

- Source Test Case: TC-XXX
  \*/

Example:

/\*\*

- Source Test Case: TC-001
  \*/

test('...', async () => {
});

---

# Reporting

After every execution create:

.ai/tasks/reports/latest-run.md

Include:

Execution Time

Generated Test Cases

Generated Auto Tests

Errors

Warnings

Skipped Items

---

# Human Approval Gates

AI may generate:

- Test Cases
- Auto Tests

AI may NOT automatically:

- Merge code
- Delete files
- Approve test cases
- Approve automated tests

Human review is mandatory.

---

# Quality Checklist

Before completing work:

- No duplicate selectors
- No duplicate pages
- No duplicate flows
- No duplicate fixtures
- TypeScript valid
- Imports valid
- Matches framework architecture
- Matches project rules
- Follows existing naming conventions

Only then mark task as completed.
