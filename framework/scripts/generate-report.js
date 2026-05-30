const fs = require('fs');
const path = require('path');

const CHANGED_TESTS_PATH = 'changed-tests.txt';
const CHANGED_TESTS_JSON_PATH = 'changed-tests.json';
const REPORT_PATH = 'playwright-report/results.json';
const SUMMARY_PATH = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON_PATH, 'utf-8'));

    return {
      added: parsed.added || [],
      modified: parsed.modified || [],
      changed: parsed.changed || [...(parsed.added || []), ...(parsed.modified || [])],
    };
  }

  if (fs.existsSync(CHANGED_TESTS_PATH)) {
    const changed = fs
      .readFileSync(CHANGED_TESTS_PATH, 'utf-8')
      .split('\n')
      .map(test => test.trim())
      .filter(Boolean);

    return {
      added: [],
      modified: changed,
      changed,
    };
  }

  return {
    added: [],
    modified: [],
    changed: [],
  };
}

function normalizeFilePath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');
  const relativePath = path.isAbsolute(normalized)
    ? path.relative(process.cwd(), normalized).replace(/\\/g, '/')
    : normalized.replace(/^\.\//, '');

  if (relativePath.startsWith('framework/tests/')) {
    return relativePath;
  }

  if (relativePath.startsWith('tests/')) {
    return `framework/${relativePath}`;
  }

  return `framework/tests/${relativePath}`;
}

function classifyError(message = '', status = '') {
  const lower = `${message} ${status}`.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('waiting for selector') ||
    lower.includes('waiting for getby')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect') ||
    lower.includes('assert') ||
    lower.includes('tohavetext') ||
    lower.includes('tocontaintext') ||
    lower.includes('tohaveurl')
  ) {
    return 'assertion mismatch';
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timedout') ||
    lower.includes('timed out')
  ) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::err') ||
    lower.includes('econnreset') ||
    lower.includes('api') ||
    lower.includes('network') ||
    lower.includes('request failed')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('page.goto') ||
    lower.includes('tohaveurl') ||
    lower.includes('load state')
  ) {
    return 'navigation failure';
  }

  return 'test execution issue';
}

function isFailedTest(test) {
  if (test.status === 'unexpected') {
    return true;
  }

  if (['expected', 'flaky', 'skipped'].includes(test.status)) {
    return false;
  }

  const results = test.results || [];
  const finalResult = results[results.length - 1];
  return ['failed', 'timedOut', 'interrupted'].includes(finalResult?.status);
}

function getFinalFailure(test) {
  const result = [...(test.results || [])]
    .reverse()
    .find(entry => ['failed', 'timedOut', 'interrupted'].includes(entry.status));

  return {
    status: result?.status || test.status || '',
    message: result?.error?.message || result?.error?.value || '',
  };
}

function collectFailures(suites = []) {
  const failuresByFile = new Map();

  function visitSuite(suite) {
    for (const spec of suite.specs || []) {
      const filePath = normalizeFilePath(spec.file);

      for (const test of spec.tests || []) {
        if (!isFailedTest(test)) {
          continue;
        }

        const failure = getFinalFailure(test);
        const reasons = failuresByFile.get(filePath) || new Set();
        reasons.add(classifyError(failure.message, failure.status));
        failuresByFile.set(filePath, reasons);
      }
    }

    for (const childSuite of suite.suites || []) {
      visitSuite(childSuite);
    }
  }

  for (const suite of suites) {
    visitSuite(suite);
  }

  return failuresByFile;
}

function readFailures() {
  if (!fs.existsSync(REPORT_PATH)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  return collectFailures(report.suites || []);
}

function appendTestList(lines, tests) {
  for (const test of tests) {
    lines.push(`* ${test}`);
  }
}

function appendResult(lines, label, tests, failuresByFile) {
  if (tests.length === 0) {
    return;
  }

  const failedReasons = new Set();

  if (failuresByFile === null) {
    failedReasons.add('test execution issue');
  } else {
    for (const test of tests) {
      for (const reason of failuresByFile.get(test) || []) {
        failedReasons.add(reason);
      }
    }
  }

  lines.push(`${label} tests:`);
  lines.push('');
  appendTestList(lines, tests);
  lines.push('');
  lines.push('Result:');

  if (failedReasons.size === 0) {
    lines.push(label === 'Added'
      ? 'All newly added tests passed successfully.'
      : 'Modified tests passed successfully without detected issues.');
  } else {
    lines.push(label === 'Added'
      ? 'New tests failed during execution.'
      : 'Regression failed.');
    lines.push('');
    lines.push('Possible reasons:');

    for (const reason of [...failedReasons].sort()) {
      lines.push(`* ${reason}`);
    }
  }

  lines.push('');
}

function buildSummary(changedTests, failuresByFile) {
  const lines = ['Lightweight QA Regression Summary', ''];

  if (changedTests.changed.length === 0) {
    lines.push('No regression execution required.');
    lines.push('No added or modified Playwright tests detected under framework/tests.');
    lines.push('');
    return lines.join('\n');
  }

  appendResult(lines, 'Added', changedTests.added, failuresByFile);
  appendResult(lines, 'Modified', changedTests.modified, failuresByFile);

  return lines.join('\n');
}

const changedTests = readChangedTests();
const failuresByFile = readFailures();
const summary = buildSummary(changedTests, failuresByFile);

fs.writeFileSync(SUMMARY_PATH, summary);
console.log(summary);
