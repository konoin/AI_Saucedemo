const fs = require('fs');
const path = require('path');

const REPORT_PATH = 'playwright-report/results.json';
const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_TXT = 'changed-tests.txt';
const OUTPUT_PATH =
  process.env.QA_REGRESSION_SUMMARY_PATH || 'qa-regression-summary.txt';

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function normalizePath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');

  if (path.isAbsolute(normalized)) {
    return path.relative(process.cwd(), normalized).replace(/\\/g, '/');
  }

  const testsIndex = normalized.indexOf('framework/tests/');
  return testsIndex >= 0 ? normalized.slice(testsIndex) : normalized;
}

function readChangedTests() {
  const metadata = readJsonIfExists(CHANGED_TESTS_JSON);

  if (metadata) {
    return {
      added: (metadata.added || []).map(normalizePath),
      modified: (metadata.modified || []).map(normalizePath),
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_TXT)) {
    return {
      added: [],
      modified: [],
    };
  }

  return {
    added: [],
    modified: fs
      .readFileSync(CHANGED_TESTS_TXT, 'utf-8')
      .split('\n')
      .map((file) => normalizePath(file.trim()))
      .filter(Boolean),
  };
}

function isFailureStatus(status = '') {
  return ['failed', 'timedOut', 'unexpected', 'interrupted'].includes(status);
}

function extractErrorMessage(result = {}) {
  const messages = [];

  if (result.error?.message) {
    messages.push(result.error.message);
  }

  if (result.error?.value) {
    messages.push(result.error.value);
  }

  if (Array.isArray(result.errors)) {
    for (const error of result.errors) {
      if (error.message) {
        messages.push(error.message);
      }

      if (error.value) {
        messages.push(error.value);
      }
    }
  }

  return messages.join('\n');
}

function classifyPossibleReason(message = '', status = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('waiting for') ||
    lower.includes('strict mode violation')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect(') ||
    lower.includes('tohave') ||
    (lower.includes('expected') && lower.includes('received'))
  ) {
    return 'assertion mismatch';
  }

  if (
    status === 'timedOut' ||
    lower.includes('timeout') ||
    lower.includes('timed out')
  ) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::err') ||
    lower.includes('econnreset') ||
    lower.includes('network') ||
    lower.includes('failed to fetch')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('page.goto') ||
    lower.includes('load state') ||
    lower.includes('url')
  ) {
    return 'navigation failure';
  }

  return 'unknown execution failure';
}

function createFileResult() {
  return {
    executed: false,
    failures: [],
  };
}

function collectPlaywrightResults(report) {
  const resultsByFile = new Map();

  function getFileResult(filePath) {
    if (!resultsByFile.has(filePath)) {
      resultsByFile.set(filePath, createFileResult());
    }

    return resultsByFile.get(filePath);
  }

  function visitSuite(suite) {
    for (const spec of suite.specs || []) {
      const filePath = normalizePath(spec.file || suite.file || '');
      const fileResult = getFileResult(filePath);

      for (const test of spec.tests || []) {
        fileResult.executed = true;

        const attempts = test.results || [];
        const finalResult = attempts[attempts.length - 1] || {};
        const finalStatus = test.status || finalResult.status || 'unknown';

        if (isFailureStatus(finalStatus) || isFailureStatus(finalResult.status)) {
          const message = extractErrorMessage(finalResult);

          fileResult.failures.push({
            title: spec.title || test.title || 'Unnamed test',
            reason: classifyPossibleReason(message, finalResult.status),
          });
        }
      }
    }

    for (const childSuite of suite.suites || []) {
      visitSuite(childSuite);
    }
  }

  for (const suite of report.suites || []) {
    visitSuite(suite);
  }

  return resultsByFile;
}

function formatList(files) {
  if (files.length === 0) {
    return ['* None detected.'];
  }

  return files.map((file) => `* ${file}`);
}

function unique(values) {
  return [...new Set(values)];
}

function buildGroupResult({
  files,
  label,
  passedMessage,
  failedMessage,
  resultsByFile,
  reportAvailable,
}) {
  const lines = [`${label}:`, ...formatList(files), '', 'Result:'];

  if (files.length === 0) {
    lines.push(`No ${label.toLowerCase()} detected.`);
    return lines;
  }

  if (!reportAvailable) {
    lines.push('Regression result unavailable.');
    lines.push('');
    lines.push('Possible reasons:');
    lines.push('* Playwright JSON report was not generated');
    return lines;
  }

  const missingResults = files.filter(
    (file) => !resultsByFile.get(file)?.executed,
  );
  const failures = files.flatMap((file) => resultsByFile.get(file)?.failures || []);

  if (failures.length > 0) {
    lines.push(failedMessage);
    lines.push('');
    lines.push('Possible reasons:');

    for (const reason of unique(failures.map((failure) => failure.reason))) {
      lines.push(`* ${reason}`);
    }

    return lines;
  }

  if (missingResults.length > 0) {
    lines.push('Regression result incomplete.');
    lines.push('');
    lines.push('No result found for:');

    for (const file of missingResults) {
      lines.push(`* ${file}`);
    }

    return lines;
  }

  lines.push(passedMessage);
  return lines;
}

const changedTests = readChangedTests();
const report = readJsonIfExists(REPORT_PATH);
const reportAvailable = Boolean(report);
const resultsByFile = reportAvailable
  ? collectPlaywrightResults(report)
  : new Map();
const hasChangedTests =
  changedTests.added.length > 0 || changedTests.modified.length > 0;
const lines = ['Lightweight QA Regression Summary', ''];

if (!hasChangedTests) {
  lines.push('Added tests:');
  lines.push('* None detected.');
  lines.push('');
  lines.push('Modified tests:');
  lines.push('* None detected.');
  lines.push('');
  lines.push('Result:');
  lines.push(
    'No in-scope Playwright test changes matched framework/tests/**/*.spec.ts or framework/tests/**/*.test.ts.',
  );
  lines.push('Regression execution skipped.');
} else {
  lines.push(
    ...buildGroupResult({
      files: changedTests.added,
      label: 'Added tests',
      passedMessage: 'All newly added tests passed successfully.',
      failedMessage: 'New tests failed during execution.',
      resultsByFile,
      reportAvailable,
    }),
  );
  lines.push('');
  lines.push(
    ...buildGroupResult({
      files: changedTests.modified,
      label: 'Modified tests',
      passedMessage: 'Modified tests passed successfully without detected issues.',
      failedMessage: 'Regression failed.',
      resultsByFile,
      reportAvailable,
    }),
  );
}

if (process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY) {
  lines.push('');
  lines.push('GitHub Actions Run:');
  lines.push(
    `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  );
}

const summary = `${lines.join('\n')}\n`;

fs.writeFileSync(OUTPUT_PATH, summary, 'utf-8');
console.log(summary);
