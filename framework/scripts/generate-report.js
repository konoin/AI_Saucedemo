const fs = require('fs');
const path = require('path');

const CHANGED_TESTS_JSON_PATH = 'changed-tests.json';
const CHANGED_TESTS_PATH = 'changed-tests.txt';
const PLAYWRIGHT_REPORT_PATH = 'playwright-report/results.json';
const SUMMARY_PATH = 'qa-regression-summary.txt';

function normalizeFilePath(filePath = '') {
  const normalized = filePath
    .replace(/\\/g, '/')
    .replace(`${process.cwd().replace(/\\/g, '/')}/`, '')
    .replace(/^\.\//, '');

  if (normalized.startsWith('framework/tests/')) {
    return normalized;
  }

  if (normalized.endsWith('.spec.ts') || normalized.endsWith('.test.ts')) {
    return path.posix.join('framework/tests', normalized);
  }

  return normalized;
}

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON_PATH)) {
    const changed = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON_PATH, 'utf-8'));

    return {
      added: changed.added ?? [],
      modified: changed.modified ?? [],
      all: changed.all ?? [],
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_PATH)) {
    return { added: [], modified: [], all: [] };
  }

  const all = fs
    .readFileSync(CHANGED_TESTS_PATH, 'utf-8')
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  return { added: [], modified: all, all };
}

function classifyFailure(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('testid') ||
    lower.includes('element') ||
    lower.includes('not visible') ||
    lower.includes('strict mode violation')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect') ||
    lower.includes('expected') ||
    lower.includes('received') ||
    lower.includes('tohavetext') ||
    lower.includes('tocontaintext')
  ) {
    return 'assertion mismatch';
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('waiting for')
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

  return 'test execution failure';
}

function finalResultFor(test) {
  const results = test.results ?? [];
  const finalResult = results[results.length - 1] ?? {};
  const errors = [
    finalResult.error?.message,
    ...(finalResult.errors ?? []).map((error) => error.message),
  ].filter(Boolean);

  return {
    status: test.status ?? finalResult.status ?? 'unknown',
    finalStatus: finalResult.status ?? 'unknown',
    errorMessage: errors.join('\n'),
  };
}

function isFailure(outcome) {
  return (
    outcome.status === 'unexpected' ||
    outcome.finalStatus === 'failed' ||
    outcome.finalStatus === 'timedOut' ||
    outcome.finalStatus === 'interrupted'
  );
}

function collectSpecOutcomes(suites = [], outcomesByFile = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const filePath = normalizeFilePath(spec.file);
      const current = outcomesByFile.get(filePath) ?? {
        failures: [],
        seen: false,
      };

      current.seen = true;

      for (const test of spec.tests ?? []) {
        const outcome = finalResultFor(test);

        if (isFailure(outcome)) {
          current.failures.push({
            title: spec.title,
            reason: classifyFailure(outcome.errorMessage),
          });
        }
      }

      outcomesByFile.set(filePath, current);
    }

    collectSpecOutcomes(suite.suites ?? [], outcomesByFile);
  }

  return outcomesByFile;
}

function readPlaywrightOutcomes() {
  if (!fs.existsSync(PLAYWRIGHT_REPORT_PATH)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(PLAYWRIGHT_REPORT_PATH, 'utf-8'));
  return collectSpecOutcomes(report.suites ?? []);
}

function listSection(files) {
  if (files.length === 0) {
    return 'None\n';
  }

  return files.map((file) => `* ${file}`).join('\n') + '\n';
}

function resultForGroup(files, outcomesByFile, successText, failureText) {
  if (files.length === 0) {
    return 'No tests in this category were detected.';
  }

  if (!outcomesByFile) {
    return [
      'Regression result unavailable.',
      '',
      'Possible reasons:',
      '* test execution did not produce a JSON report',
    ].join('\n');
  }

  const failures = files.flatMap((file) => outcomesByFile.get(file)?.failures ?? []);
  const missingResults = files.filter((file) => !outcomesByFile.get(file)?.seen);

  if (failures.length === 0 && missingResults.length === 0) {
    return successText;
  }

  const reasons = [
    ...new Set([
      ...failures.map((failure) => failure.reason),
      ...missingResults.map(() => 'test execution result missing'),
    ]),
  ];

  return [
    failureText,
    '',
    'Possible reasons:',
    ...reasons.map((reason) => `* ${reason}`),
  ].join('\n');
}

const changedTests = readChangedTests();
const outcomesByFile = readPlaywrightOutcomes();

let summary = 'Lightweight QA Regression Summary\n\n';

if (changedTests.all.length === 0) {
  summary += 'Result:\nNo regression execution required.\n';
} else {
  summary += 'Added tests:\n';
  summary += listSection(changedTests.added);
  summary += '\nResult:\n';
  summary += resultForGroup(
    changedTests.added,
    outcomesByFile,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
  );

  summary += '\n\nModified tests:\n';
  summary += listSection(changedTests.modified);
  summary += '\nResult:\n';
  summary += resultForGroup(
    changedTests.modified,
    outcomesByFile,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
  );
  summary += '\n';
}

fs.writeFileSync(SUMMARY_PATH, summary, 'utf-8');
console.log(summary);
