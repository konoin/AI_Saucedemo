# AI Saucedemo

## AI selective Playwright regression

This repository includes a production-style GitHub Actions workflow at:

- `.github/workflows/ai-regression.yml`

The workflow runs on every push to `main`, detects modified or newly added
Playwright test files, and executes only those impacted tests. The detector is
configured for the requested test paths plus the current repository test
directory:

- `tests/**/*.spec.ts`
- `tests/**/*.test.ts`
- `framework/tests/**/*.spec.ts`
- `framework/tests/**/*.test.ts`

### Helper scripts

- `npm run ci:changed-tests` detects changed Playwright test files.
- `npm run ci:run-changed-tests` runs only the detected files with Playwright.
- `npm run ci:format-regression-summary` creates the Markdown/email summary.

Generated CI artifacts are written under `regression-results/` and include:

- `changed-tests.json`
- `summary.json`
- `summary.md`
- `playwright-results.json`
- `playwright-stderr.log`

### Email notification setup

Configure these GitHub Actions repository secrets:

- `SMTP_SERVER`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `EMAIL_TO`
- `EMAIL_FROM`

Optional repository variable:

- `SMTP_SECURE` - defaults to `true` when omitted.

The email body includes the execution summary, failed test names, and the
GitHub Actions run URL. If SMTP settings are missing, the workflow records a
warning and still reports the regression result.

### Local usage

To exercise the workflow scripts locally:

```bash
npm ci
npx playwright install --with-deps
node framework/scripts/find-changed-tests.js --base HEAD~1 --head HEAD
node framework/scripts/run-changed-tests.js
node framework/scripts/format-regression-summary.js
```

The runner disables retries with `--retries=0` and uses `PLAYWRIGHT_WORKERS`
for parallelism. The workflow defaults `PLAYWRIGHT_WORKERS` to `50%`.
