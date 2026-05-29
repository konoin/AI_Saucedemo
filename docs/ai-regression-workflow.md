# AI Selective Playwright Regression Workflow

This repository includes a GitHub Actions workflow at
`.github/workflows/ai-regression.yml` that runs on pushes to `main` and executes
only changed or newly added Playwright test files.

## What the workflow does

1. Checks out the full Git history for deterministic diff analysis.
2. Detects changed or newly added tests matching:
   - `tests/**/*.spec.ts`
   - `tests/**/*.test.ts`
   - `framework/tests/**/*.spec.ts`
   - `framework/tests/**/*.test.ts`
3. Skips dependency and browser installation when no impacted tests are found.
4. Runs only impacted test files with Playwright, zero retries, and configurable
   parallel workers.
5. Generates:
   - `changed-tests.txt`
   - `regression-execution.json`
   - `summary.txt`
   - `summary.json`
   - `passed-tests.txt`
   - `failed-tests.txt`
6. Sends a pass or fail email notification that includes the execution summary,
   failed test names, duration, and GitHub Actions run URL.
7. Fails the workflow when impacted tests fail.

## Required GitHub secrets

Configure these repository secrets before enabling email notifications:

| Secret | Description |
| --- | --- |
| `SMTP_SERVER` | SMTP server host, for example `smtp.gmail.com`. |
| `SMTP_PORT` | SMTP server port, for example `465` or `587`. |
| `SMTP_SECURE` | `true` for TLS-on-connect, otherwise `false`. |
| `SMTP_USERNAME` | SMTP authentication username. |
| `SMTP_PASSWORD` | SMTP authentication password or app password. |
| `REGRESSION_EMAIL_TO` | Notification recipient address. |
| `REGRESSION_EMAIL_FROM` | Sender address. If omitted, the workflow uses `SMTP_USERNAME`. |

## Optional configuration

The workflow defines these environment variables and can be adjusted in the YAML:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PLAYWRIGHT_TEST_GLOBS` | `tests/**/*.spec.ts,tests/**/*.test.ts,framework/tests/**/*.spec.ts,framework/tests/**/*.test.ts` | Comma-separated test file globs used by change detection. |
| `PLAYWRIGHT_WORKERS` | `2` | Parallel workers passed to Playwright. |
| `PLAYWRIGHT_JSON_REPORT` | `playwright-report/results.json` | JSON report consumed by the summary script. |

## Local usage

Run the helper scripts directly when validating the workflow locally:

```bash
npm run regression:changed
npm ci
npx playwright install --with-deps
npm run regression:run
npm run regression:report
```

For local diff testing, set `BASE_SHA` and `HEAD_SHA`:

```bash
BASE_SHA=origin/main HEAD_SHA=HEAD npm run regression:changed
```
