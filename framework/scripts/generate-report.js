const fs = require('fs');
const path = require('path');

const CHANGED_TESTS_PATH = 'changed-tests.json';
const REPORT_PATH = 'playwright-report/results.json';
const SUMMARY_PATH = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_PATH)) {
    return JSON.parse(fs.readFileSync(CHANGED_TESTS_PATH, 'utf-8'));
  }

  return {
    added: [],
    modified: [],
    all: [],
  };
}

function normalizeTestPath(file = '') {
  const normalized = file.replace(/\\/g, '/');
  const frameworkIndex = normalized.indexOf('framework/tests/');

  if (frameworkIndex >= 0) {
    return normalized.slice(frameworkIndex);
  }

  if (!normalized.includes('/')) {
    return path.posix.join('framework/tests', normalized);
  }

  return normalized;
}

function finalResultFor(test) {
  const results = Array.isArray(test.results) ? test.results : [];
  return results[results.length - 1] || {};
}

function testFailed(test) {
  if (test.outcome === 'unexpected' || test.status === 'failed' || test.status === 'timedOut') {
    return true;
  }

  const finalResult = finalResultFor(test);
  return ['failed', 'timedOut', 'interrupted'].includes(finalResult.status);
}

function classifyPossibleCause(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('strict mode violation') ||
    lower.includes('waiting for selector')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect(') ||
    lower.includes('expected') ||
    lower.includes('tohavetext') ||
    lower.includes('tocontaintext') ||
    lower.includes('tobevisible')
  ) {
    return 'assertion mismatch';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::err') ||
    lower.includes('econnreset') ||
    lower.includes('api') ||
    lower.includes('request failed') ||
    lower.includes('waiting for response')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('tohaveurl') ||
    lower.includes('page.goto') ||
    lower.includes('waiting for url')
  ) {
    return 'navigation failure';
  }

  return 'test execution issue';
}

function collectFailuresFromSuites(suites = [], failures = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const file = normalizeTestPath(spec.file || suite.file || suite.title);

      for (const test of spec.tests || []) {
        if (!testFailed(test)) {
          continue;
        }

        const finalResult = finalResultFor(test);
        const message =
          finalResult.error?.message ||
          finalResult.errors?.[0]?.message ||
          finalResult.status ||
          'Unknown failure';
        const key = `${file}:${spec.title}`;

        if (!failures.has(key)) {
          failures.set(key, {
            file,
            cause: classifyPossibleCause(message),
          });
        }
      }
    }

    collectFailuresFromSuites(suite.suites || [], failures);
  }

  return failures;
}

function readFailures(changedTests) {
  if (changedTests.all.length === 0) {
    return [];
  }

  if (!fs.existsSync(REPORT_PATH)) {
    return changedTests.all.map((file) => ({
      file: normalizeTestPath(file),
      cause: 'test execution issue',
    }));
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  const changedTestSet = new Set(changedTests.all.map(normalizeTestPath));

  return Array.from(collectFailuresFromSuites(report.suites || []).values()).filter((failure) =>
    changedTestSet.has(failure.file)
  );
}

function uniqueCausesFor(files, failures) {
  const fileSet = new Set(files.map(normalizeTestPath));
  return Array.from(
    new Set(failures.filter((failure) => fileSet.has(failure.file)).map((failure) => failure.cause))
  );
}

function appendTestList(lines, tests) {
  if (tests.length === 0) {
    lines.push('* None');
    return;
  }

  tests.forEach((test) => lines.push(`* ${test}`));
}

function appendGroupSummary(lines, label, tests, passMessage, failMessage, failures) {
  lines.push(`${label}:`);
  appendTestList(lines, tests);
  lines.push('');

  if (tests.length === 0) {
    lines.push('Result:');
    lines.push('No tests in this category.');
    lines.push('');
    return;
  }

  const causes = uniqueCausesFor(tests, failures);

  lines.push('Result:');
  if (causes.length === 0) {
    lines.push(passMessage);
    lines.push('');
    return;
  }

  lines.push(failMessage);
  lines.push('');
  lines.push('Possible reasons:');
  causes.forEach((cause) => lines.push(`* ${cause}`));
  lines.push('');
}

function buildSummary(changedTests, failures) {
  const lines = ['Lightweight QA Regression Summary', ''];

  if (changedTests.all.length === 0) {
    lines.push('No added or modified Playwright tests detected.');
    lines.push('');
    lines.push('Result:');
    lines.push('No regression execution required.');
    lines.push('');
    return lines.join('\n');
  }

  appendGroupSummary(
    lines,
    'Added tests',
    changedTests.added,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    failures
  );

  appendGroupSummary(
    lines,
    'Modified tests',
    changedTests.modified,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    failures
  );

  return lines.join('\n');
}

const changedTests = readChangedTests();
const failures = readFailures(changedTests);
const summary = buildSummary(changedTests, failures);

fs.writeFileSync(SUMMARY_PATH, summary);
console.log(summary);
