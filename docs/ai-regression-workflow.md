# AI Selective Regression Workflow

This repository includes a GitHub Actions workflow for impacted Playwright
regression execution:

- Workflow: `.github/workflows/ai-regression.yml`
- Full-suite workflow: `.github/workflows/playwright.yml` (pull request and
  manual execution only)
- Changed-test detector: `framework/scripts/find-changed-tests.js`
- Selective runner: `framework/scripts/run-impacted-tests.js`
- Report generator: `framework/scripts/generate-report.js`

## What it does

On every push to `main`, the workflow:

1. Compares the push base SHA with the new head SHA.
2. Detects modified, newly added, or renamed Playwright test files matching:
   - `tests/**/*.spec.ts`
   - `tests/**/*.test.ts`
   - `framework/tests/**/*.spec.ts`
   - `framework/tests/**/*.test.ts`
3. Installs Node dependencies and Playwright browsers only when impacted tests
   exist.
4. Runs only the impacted test files with zero retries.
5. Generates `summary.txt` and `playwright-report/regression-summary.json`
   containing:
   - executed test files
   - passed test cases
   - failed test cases
   - skipped test cases
   - execution duration
   - GitHub Actions run URL
6. Uploads the report artifacts.
7. Sends an email notification when mail secrets are configured.
8. Fails the workflow when impacted tests fail.

## Required GitHub secrets

Configure these repository secrets before relying on email notifications:

| Secret               | Required | Description                                      |
| -------------------- | -------- | ------------------------------------------------ |
| `EMAIL_USERNAME`     | Yes      | SMTP username. For Gmail, use the account email. |
| `EMAIL_PASSWORD`     | Yes      | SMTP password or app password.                   |
| `NOTIFICATION_EMAIL` | Yes      | Recipient email address for regression reports.  |

## Optional GitHub secrets

| Secret        | Default          | Description                               |
| ------------- | ---------------- | ----------------------------------------- |
| `EMAIL_FROM`  | `EMAIL_USERNAME` | Sender address shown on the notification. |
| `SMTP_SERVER` | `smtp.gmail.com` | SMTP host.                                |
| `SMTP_PORT`   | `465`            | SMTP port.                                |
| `SMTP_SECURE` | `true`           | Whether to use TLS.                       |

If required email secrets are missing, the workflow still runs and uploads
artifacts, but the notification step is skipped.

## Runtime configuration

The workflow exposes these environment variables for maintainers:

| Variable              | Default                                                                                           | Description                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `TEST_FILE_GLOBS`     | `tests/**/*.spec.ts,tests/**/*.test.ts,framework/tests/**/*.spec.ts,framework/tests/**/*.test.ts` | Comma-separated changed-test patterns.                                       |
| `PLAYWRIGHT_WORKERS`  | `2`                                                                                               | Parallel Playwright workers for impacted tests.                              |
| `PLAYWRIGHT_PROJECTS` | unset                                                                                             | Optional comma-separated Playwright projects to run, for example `chromium`. |

Keep retries at zero for this workflow so failures remain visible and flaky
tests are not hidden by repeated attempts.

## Local commands

Useful local checks:

```bash
npm run regression:changed -- --base origin/main --head HEAD --output changed-tests.txt
npm run regression:run -- --tests-file changed-tests.txt --workers 2
npm run regression:report -- --tests-file changed-tests.txt
```

The local commands use the same scripts as CI, which keeps behavior consistent
between developer machines and GitHub Actions.
