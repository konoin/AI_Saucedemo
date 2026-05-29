# AI Saucedemo Playwright Regression Platform

This repository contains a Playwright suite for Saucedemo plus an AI-augmented selective regression pipeline designed for fast, actionable CI feedback.

## What the regression platform does

- Runs automatically on pushes to `main` and pull requests targeting `main`.
- Detects changed or newly added Playwright tests under `framework/tests/**/*.spec.ts` and `framework/tests/**/*.test.ts`.
- Adds impacted tests when `framework/config/impact-map.json` maps changed source files to regression coverage.
- Executes only selected tests, avoiding full regression unless the workflow is intentionally extended to do so.
- Classifies Playwright failures into actionable categories:
  - Locator Failure
  - Assertion Failure
  - Timeout
  - Network Failure
  - Environment Failure
  - Flaky Test
  - Unknown Failure
- Deduplicates retry failures with the same root cause.
- Generates concise CI reports in `summary.txt` and structured JSON in `framework/reports/regression-report.json`.
- Updates flaky history, recommends quarantine candidates, and skips tests explicitly listed in `framework/config/flaky-quarantine.json`.
- Sends an email notification after reporting is generated, even when tests fail.

## GitHub Actions workflow

Workflow file: `.github/workflows/ai-regression.yml`

The workflow stages are:

1. Checkout with full history for accurate diff detection.
2. Install Node.js dependencies and the Chromium Playwright browser.
3. Restore `.regression-cache` to retain flaky history across CI runs.
4. Detect changed, added, and impacted tests.
5. Run only runnable selected tests.
6. Analyze flaky behavior and quarantine candidates.
7. Generate executive-style regression reports.
8. Upload Playwright traces/reports and regression artifacts.
9. Send the final email notification when email secrets are configured.
10. Fail the workflow only after reports, artifacts, and notifications are handled.

## Local commands

```bash
npm ci
npx playwright install chromium
npm run regression:detect
npm run regression:run
npm run regression:flaky
npm run regression:report
npm run regression:gate
```

For local PR-style comparison, set the base/head SHAs before detection:

```bash
BASE_SHA=origin/main HEAD_SHA=HEAD npm run regression:detect
```

## Required GitHub Secrets

Configure these repository secrets to enable email notifications:

| Secret | Purpose |
| --- | --- |
| `EMAIL_USERNAME` | SMTP username and sender address. |
| `EMAIL_PASSWORD` | SMTP password or app password. |
| `NOTIFICATION_EMAIL` | Recipient email address for final regression reports. |

The default workflow uses Gmail SMTP through `dawidd6/action-send-mail@v3`:

- SMTP host: `smtp.gmail.com`
- Port: `465`
- TLS: enabled

If these secrets are absent, regression still runs and uploads reports; only the email step is skipped.

## Optional GitHub configuration

The workflow uses these environment defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `REGRESSION_PROJECTS` | `chromium` | Comma-separated Playwright projects to run. |
| `PLAYWRIGHT_RETRIES` | `1` | Minimal retry count for flaky visibility. |
| `PLAYWRIGHT_WORKERS` | `2` | Deterministic CI parallelism. |
| `FLAKY_QUARANTINE_THRESHOLD` | `3` | Number of observed flaky runs before quarantine is recommended. |
| `PLAYWRIGHT_REPORT_URL` | GitHub Actions artifacts URL | URL shown in notifications for the Playwright HTML report. |

## Impacted-test mapping

Edit `framework/config/impact-map.json` to scale beyond directly changed tests.

Example:

```json
{
  "mappings": [
    {
      "area": "checkout",
      "source": ["framework/pages/**", "framework/api/checkout/**"],
      "tests": ["framework/tests/checkout.spec.ts"]
    }
  ]
}
```

When a changed file matches a `source` pattern, the mapped `tests` are added to the selective regression plan.

## Flaky quarantine process

1. The workflow detects flaky tests when a test fails on an attempt and passes on retry.
2. Flaky history is stored in `.regression-cache/flaky-history.json` and restored by GitHub Actions cache.
3. Repeatedly unstable tests are listed in `framework/reports/flaky-quarantine-candidates.json`.
4. To quarantine a test file at runtime, add it to `framework/config/flaky-quarantine.json`:

```json
{
  "quarantinedFiles": ["framework/tests/checkout.spec.ts"],
  "quarantinedTests": [
    {
      "title": "successful checkout flow",
      "reason": "Intermittent checkout confirmation timeout"
    }
  ]
}
```

Keep quarantines temporary. Remove entries once the root cause is fixed.

## Report artifacts

Each CI run uploads `ai-regression-artifacts`, including:

- Playwright HTML report
- Playwright traces in `test-results/`
- `summary.txt`
- `regression-plan.json`
- `framework/reports/regression-report.json`
- `framework/reports/flaky-quarantine-candidates.json`
- changed/runnable/quarantined/flaky test lists
