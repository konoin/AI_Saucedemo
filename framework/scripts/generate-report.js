const fs = require('fs');
const path = require('path');

const CHANGED_TESTS_PATH = 'changed-tests.json';
const REPORT_PATH = 'playwright-report/results.json';
const SUMMARY_PATH = 'qa-regression-summary.txt';

function readChangedTests() {
  if (!fs.existsSync(CHANGED_TESTS_PATH)) {
    return { added: [], modified: [], all: [] };
  }

  const changedTests = JSON.parse(fs.readFileSync(CHANGED_TESTS_PATH, 'utf-8'));
  const added = changedTests.added ?? [];
  const modified = changedTests.modified ?? [];

  return {
    added,
    modified,
    all: changedTests.all ?? [...added, ...modified],
  };
}

function normalizeSpecPath(specPath = '') {
  const normalized = specPath.split(path.sep).join('/');

  if (normalized.startsWith('framework/tests/')) {
    return normalized;
  }

  return `framework/tests/${normalized}`;
}

function possibleCause(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('waiting for locator')
  ) {
    return 'locator not found';
  }

  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('timedout')) {
    return 'timeout exceeded';
  }

  if (lower.includes('expect') || lower.includes('tohavetext') || lower.includes('tocontaintext')) {
    return 'assertion mismatch';
  }

  if (
    lower.includes('net::err') ||
    lower.includes('econnreset') ||
    lower.includes('api') ||
    lower.includes('request') ||
    lower.includes('response')
  ) {
    return 'API/network failure';
  }

  if (lower.includes('navigation') || lower.includes('goto') || lower.includes('tohaveurl')) {
    return 'navigation failure';
  }

  return 'test execution issue';
}

function collectFailuresFromSuites(suites = [], changedFiles = new Set(), failures = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const file = normalizeSpecPath(spec.file);

      if (!changedFiles.has(file)) {
        continue;
      }

      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) {
          if (!['failed', 'timedOut', 'interrupted'].includes(result.status)) {
            continue;
          }

          const key = `${file}:${spec.title}`;
          const message = result.error?.message ?? result.errors?.[0]?.message ?? result.status;

          if (!failures.has(key)) {
            failures.set(key, {
              file,
              cause: possibleCause(message),
            });
          }
        }
      }
    }

    collectFailuresFromSuites(suite.suites ?? [], changedFiles, failures);
  }

  return failures;
}

function readFailures(changedTests) {
  if (changedTests.all.length === 0) {
    return [];
  }

  if (!fs.existsSync(REPORT_PATH)) {
    return changedTests.all.map((file) => ({
      file: normalizeSpecPath(file),
      cause: 'test execution issue',
    }));
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  const changedFiles = new Set(changedTests.all.map(normalizeSpecPath));

  return Array.from(collectFailuresFromSuites(report.suites ?? [], changedFiles).values());
}

function formatList(files) {
  if (files.length === 0) {
    return '* none\n';
  }

  return files.map((file) => `* ${file}`).join('\n') + '\n';
}

function formatCauses(failures) {
  const causes = [...new Set(failures.map((failure) => failure.cause))];

  if (causes.length === 0) {
    return '';
  }

  return `\nPossible reasons:\n${causes.map((cause) => `* ${cause}`).join('\n')}\n`;
}

function formatSection(title, files, emptyMessage, successMessage, failureMessage, failures) {
  const sectionFailures = failures.filter((failure) => files.includes(failure.file));
  const result = files.length === 0
    ? emptyMessage
    : sectionFailures.length === 0
      ? successMessage
      : failureMessage;

  return `${title}:\n${formatList(files)}\nResult:\n${result}\n${formatCauses(sectionFailures)}`;
}

function buildSummary(changedTests, failures) {
  if (changedTests.all.length === 0) {
    return [
      'Lightweight QA Regression Summary',
      '',
      'No added or modified Playwright tests detected.',
      '',
      'Result:',
      'No regression execution required.',
      '',
    ].join('\n');
  }

  return [
    'Lightweight QA Regression Summary',
    '',
    formatSection(
      'Added tests',
      changedTests.added,
      'No newly added tests detected.',
      'All newly added tests passed successfully.',
      'New tests failed during execution.',
      failures,
    ),
    formatSection(
      'Modified tests',
      changedTests.modified,
      'No modified tests detected.',
      'Modified tests passed successfully without detected issues.',
      'Regression failed.',
      failures,
    ),
  ].join('\n');
}

const changedTests = readChangedTests();
const failures = readFailures(changedTests);
const summary = buildSummary(changedTests, failures);

fs.writeFileSync(SUMMARY_PATH, summary);
console.log(summary);
