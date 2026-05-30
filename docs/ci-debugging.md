# CI Debugging Guide

## How CI runs tests

Workflow: `.github/workflows/ai-regression.yml` (behavior unchanged).

1. Installs dependencies and Playwright browsers
2. Detects changed files matching `framework/tests/**/*.spec.ts` vs `main`
3. Runs `npx playwright test` only on those files
4. Uploads artifacts on every run (`if: always()`)

## Investigating a failed PR check

### 1. GitHub Actions log

Open the failed run → **Run changed Playwright tests** step.

- Read `test-output.txt` content in the log
- Note which spec and project (chromium/firefox/webkit) failed

### 2. Download artifacts

From the Actions run **Artifacts** panel:

| Artifact | Contents |
|----------|----------|
| `playwright-output` | Console output (`test-output.txt`) |
| `playwright-report` | HTML report folder |

### 3. Playwright HTML report

1. Download `playwright-report` artifact
2. Unzip and open `index.html` in a browser
3. Drill into the failed test → see steps, errors, attachments

The report is generated because `playwright.config.ts` includes the `html` reporter.

## Traces

**Local config:** `trace: 'retain-on-failure'` in `playwright.config.ts`.

On failure, traces are stored under `test-results/` (gitignored).

**View locally:**

```bash
npx playwright show-trace test-results/<path-to-trace>/trace.zip
```

**CI note:** The workflow uploads `playwright-report/` but not `test-results/` by default. For deep CI debugging, download the HTML report first; if traces are embedded in the report, open them from there. To always get trace zips in CI, a future improvement would upload `test-results/` as a separate artifact (does not change current workflow behavior).

## Screenshots

**Config:** `screenshot: 'only-on-failure'`

Captured automatically on failure and attached to the HTML report / `test-results/`.

## Video

**Config:** `video: 'retain-on-failure'`

Retained only when a test fails; useful for timing and navigation issues.

## JSON report

`playwright-report/results.json` is produced for tooling (e.g. `framework/scripts/generate-report.js`).

## Local reproduction

```bash
npm ci
npx playwright install
npm test
# or match CI single file:
npx playwright test framework/tests/checkout.spec.ts
```

## MCP-assisted debugging (Cursor)

1. Enable Playwright MCP (`.cursor/mcp.json` — do not modify without team approval)
2. Follow `.ai/MCP_GUIDE.md` to reproduce the failing step in the browser
3. Compare live `data-test` attributes with `Selectors` in `framework/constants/selectors.ts`

## Quick checklist

- [ ] Read Actions log for the exact assertion/error
- [ ] Open HTML report artifact
- [ ] Check screenshot/video on the failed step
- [ ] Re-run locally with `npm test`
- [ ] Use trace viewer if available
- [ ] Verify selectors in `framework/constants/selectors.ts`
