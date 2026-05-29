# AI Saucedemo

Playwright regression automation for Sauce Demo.

## Selective regression workflow

Pushes to `main` run the AI selective Playwright regression workflow in
`.github/workflows/ai-regression.yml`. The workflow detects changed or newly
added Playwright tests, runs only impacted files, reports passed and failed
tests, and sends pass/fail email notifications.

Setup instructions and required GitHub secrets are documented in
[`docs/ai-regression-workflow.md`](docs/ai-regression-workflow.md).
