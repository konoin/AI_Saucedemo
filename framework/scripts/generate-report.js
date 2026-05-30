const fs = require('fs');
const path = require('path');

const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_TEXT = 'changed-tests.txt';
const PLAYWRIGHT_JSON = 'playwright-report/results.json';
const SUMMARY_FILE = 'qa-regression-summary.txt';

function normalizePath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');
  const relativePath = path.isAbsolute(normalized)
    ? path.relative(process.cwd(), normalized).replace(/\\/g, '/')
    : normalized;
  const testRootIndex = relativePath.indexOf('framework/tests/');

  if (testRootIndex >= 0) {
    return relativePath.slice(testRootIndex);
  }

  if (/^.+\.(spec|test)\.ts$/.test(relativePath)) {
    return `framework/tests/${relativePath}`;
  }

  return relativePath;
}

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON)) {
    const parsed = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON, 'utf-8'));

    return {
      added: parsed.added ?? [],
      modified: parsed.modified ?? [],
    };
  }

  if (fs.existsSync(CHANGED_TESTS_TEXT)) {
    return {
      added: [],
      modified: fs
        .readFileSync(CHANGED_TESTS_TEXT, 'utf-8')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  return {
    added: [],
    modified: [],
  };
}

function getFinalResult(test) {
  const results = test.results ?? [];
  return results.length > 0 ? results[results.length - 1] : undefined;
}

function getFailureMessage(test, result) {
  const errors = result?.errors ?? [];

  if (result?.error?.message) {
    return result.error.message;
  }

  if (errors.length > 0 && errors[0].message) {
    return errors[0].message;
  }

  if (test.error?.message) {
    return test.error.message;
  }

  return '';
}

function isFailedTest(test, result) {
  const finalStatus = result?.status ?? test.status;
  const failedStatuses = ['failed', 'timedOut', 'interrupted'];

  return test.status === 'unexpected' || failedStatuses.includes(finalStatus);
}

function classifyPossibleCause(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('strict mode violation') ||
    lower.includes('element(s) not found') ||
    lower.includes('waiting for')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect(') ||
    lower.includes('assert') ||
    lower.includes('tohave') ||
    lower.includes('tocontain') ||
    lower.includes('expected')
  ) {
    return 'assertion mismatch';
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('exceeded')
  ) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::') ||
    lower.includes('econnreset') ||
    lower.includes('api') ||
    lower.includes('network') ||
    lower.includes('response')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('page.goto') ||
    lower.includes('url')
  ) {
    return 'navigation failure';
  }

  return 'page state issue';
}

function createFileResults(changedTests) {
  return new Map(
    [...changedTests.added, ...changedTests.modified].map((filePath) => [
      normalizePath(filePath),
      {
        seen: false,
        failures: [],
      },
    ]),
  );
}

function collectResults(suites = [], fileResults, parentFile = '') {
  suites.forEach((suite) => {
    const suiteFile = normalizePath(suite.file ?? parentFile);

    (suite.specs ?? []).forEach((spec) => {
      const specFile = normalizePath(spec.file ?? suiteFile);
      const fileResult = fileResults.get(specFile);

      if (!fileResult) {
        return;
      }

      fileResult.seen = true;

      (spec.tests ?? []).forEach((test) => {
        const finalResult = getFinalResult(test);

        if (isFailedTest(test, finalResult)) {
          fileResult.failures.push({
            title: spec.title,
            cause: classifyPossibleCause(getFailureMessage(test, finalResult)),
          });
        }
      });
    });

    collectResults(suite.suites ?? [], fileResults, suiteFile);
  });
}

function summarizeGroup(title, files, successMessage, failureMessage, fileResults) {
  if (files.length === 0) {
    return '';
  }

  const normalizedFiles = files.map(normalizePath);
  const failures = normalizedFiles.flatMap((filePath) => fileResults.get(filePath)?.failures ?? []);
  const missingResults = normalizedFiles.filter((filePath) => !fileResults.get(filePath)?.seen);
  const lines = [`${title}:`];

  files.forEach((filePath) => {
    lines.push(`* ${filePath}`);
  });

  lines.push('', 'Result:');

  if (missingResults.length > 0) {
    lines.push('Regression result unavailable.', '', 'Possible reasons:');
    lines.push('* test was not executed');
    lines.push('* Playwright JSON report was not generated');
    return `${lines.join('\n')}\n\n`;
  }

  if (failures.length === 0) {
    lines.push(successMessage);
    return `${lines.join('\n')}\n\n`;
  }

  lines.push(failureMessage, '', 'Possible reasons:');

  [...new Set(failures.map((failure) => failure.cause))].forEach((cause) => {
    lines.push(`* ${cause}`);
  });

  return `${lines.join('\n')}\n\n`;
}

function writeSummary(summary) {
  fs.writeFileSync(SUMMARY_FILE, summary, 'utf-8');
  console.log(summary);
}

const changedTests = readChangedTests();
const changedTestCount = changedTests.added.length + changedTests.modified.length;

if (changedTestCount === 0) {
  writeSummary(
    [
      'Lightweight QA Regression Summary',
      '',
      'No added or modified Playwright tests detected.',
      '',
      'Result:',
      'No regression execution required.',
      '',
    ].join('\n'),
  );
  process.exit(0);
}

const fileResults = createFileResults(changedTests);

if (fs.existsSync(PLAYWRIGHT_JSON)) {
  const report = JSON.parse(fs.readFileSync(PLAYWRIGHT_JSON, 'utf-8'));
  collectResults(report.suites ?? [], fileResults);
}

const summary = [
  'Lightweight QA Regression Summary',
  '',
  summarizeGroup(
    'Added tests',
    changedTests.added,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    fileResults,
  ),
  summarizeGroup(
    'Modified tests',
    changedTests.modified,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    fileResults,
  ),
]
  .join('')
  .trimEnd()
  .concat('\n');

writeSummary(summary);
