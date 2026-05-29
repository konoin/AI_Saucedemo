# AI-Augmented Playwright Regression Platform

This repository runs an intelligent Playwright regression workflow through GitHub Actions.
The goal is to execute only relevant tests, analyze failures, surface flaky behavior, and
send concise notifications without hiding failed test results.

## What the workflow does

- Triggers on pushes to `main`, pull requests targeting `main`, and manual dispatch.
- Detects changed or newly added Playwright tests under:
  - `framework/tests/**/*.spec.ts`
  - `framework/tests/**/*.test.ts`
- Expands execution through `framework/regression/impact-map.json` when changed source
  files map to impacted test areas.
- Excludes active entries from `framework/regression/flaky-quarantine.json`.
- Runs only selected tests unless manual dispatch requests a full regression.
- Preserves workflow execution after Playwright failures so reports, artifacts, and email
  notifications are still produced.
- Uploads:
  - `regression-intelligence` with scope, report, and quarantine analysis
  - `playwright-report` with the Playwright HTML, JSON, trace, and screenshot output

## Key files

- `.github/workflows/ai-regression.yml` - production CI workflow.
- `framework/scripts/find-changed-tests.js` - change detection and impacted test selection.
- `framework/scripts/generate-report.js` - Playwright result analysis and executive summary.
- `framework/scripts/flaky-quarantine.js` - flaky candidate detection and quarantine reporting.
- `framework/regression/impact-map.json` - feature-to-test dependency mapping.
- `framework/regression/flaky-quarantine.json` - known flaky tests to exclude from selective runs.

## Failure categories

The report classifies failures as:

- Locator Failure
- Assertion Failure
- Timeout
- Network Failure
- Environment Failure
- Flaky Test
- Unknown Failure

Retries with the same normalized root cause are deduplicated in the report.

## Required GitHub Secrets

Configure these repository secrets to enable email notifications:

- `EMAIL_USERNAME` - SMTP username or sender email.
- `EMAIL_PASSWORD` - SMTP password or app password.
- `NOTIFICATION_EMAIL` - destination email address.

The workflow uses Gmail SMTP by default:

- server: `smtp.gmail.com`
- port: `465`
- secure: `true`

If the secrets are not configured, the workflow skips email delivery and still uploads
all regression artifacts.

## Maintaining the impact map

Add mappings when source changes should run related tests even when the tests themselves
did not change:

```json
{
  "area": "checkout",
  "risk": "high",
  "tags": ["@checkout", "@smoke"],
  "changedFiles": ["framework/pages/**"],
  "tests": ["framework/tests/checkout.spec.ts"]
}
```

The `tags` and `risk` fields are metadata for future risk-based routing and reporting.

## Quarantining flaky tests

Known unstable tests can be excluded by adding entries to
`framework/regression/flaky-quarantine.json`:

```json
{
  "file": "framework/tests/checkout.spec.ts",
  "reason": "Intermittent locator timing on checkout confirmation",
  "ticket": "QA-123",
  "expiresOn": "2026-12-31",
  "active": true
}
```

The CI run also generates `flaky-quarantine-report.json` and
`flaky-quarantine-candidates.txt` so maintainers can promote repeatedly unstable tests
into quarantine with an explicit reason and follow-up ticket.

## Local commands

Detect the selective scope:

```bash
npm run regression:scope -- --base HEAD~1 --head HEAD
```

Generate the report from Playwright JSON output:

```bash
npm run regression:report
```

Evaluate flaky quarantine candidates:

```bash
npm run regression:quarantine
```

Run Playwright normally:

```bash
npm run test:playwright
```
