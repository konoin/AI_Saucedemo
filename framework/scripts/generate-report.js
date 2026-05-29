const fs = require('fs');

const reportPath = 'playwright-report/results.json';

if (!fs.existsSync(reportPath)) {
  console.error('Playwright JSON report not found.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const failedTests = [];

function classifyError(message = '') {
  const lower = message.toLowerCase();

  if (lower.includes('locator')) {
    return 'UI Locator Failure';
  }

  if (lower.includes('timeout')) {
    return 'Timeout Failure';
  }

  if (lower.includes('net::err')) {
    return 'Network Failure';
  }

  if (lower.includes('expect(')) {
    return 'Assertion Failure';
  }

  return 'Unknown Failure';
}

function extractTests(suites = []) {
  for (const suite of suites) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          for (const result of test.results) {
            if (result.status === 'failed') {
              const errorMessage =
                result.error?.message || 'Unknown error';

              failedTests.push({
                title: spec.title,
                file: spec.file,
                error: errorMessage,
                type: classifyError(errorMessage)
              });
            }
          }
        }
      }
    }

    if (suite.suites) {
      extractTests(suite.suites);
    }
  }
}

extractTests(report.suites);

let summary = '';

summary += 'AI Selective Regression Report\n\n';

summary += `Repository: ${process.env.GITHUB_REPOSITORY}\n`;
summary += `Branch: ${process.env.GITHUB_REF_NAME}\n`;
summary += `Triggered by: ${process.env.GITHUB_ACTOR}\n`;
summary += `Date: ${new Date().toISOString()}\n\n`;

if (failedTests.length === 0) {
  summary += 'RESULT: PASSED\n\n';
  summary += 'All impacted Playwright tests passed successfully.\n';
} else {
  summary += 'RESULT: FAILED\n\n';

  summary += `Failed tests count: ${failedTests.length}\n\n`;

  failedTests.forEach((test, index) => {
    summary += `${index + 1}. ${test.title}\n`;
    summary += `File: ${test.file}\n`;
    summary += `Failure Type: ${test.type}\n`;
    summary += `Error: ${test.error}\n\n`;
  });
}

summary += `GitHub Actions Run:\n`;
summary += `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;

fs.writeFileSync('summary.txt', summary);

console.log(summary);