const fs = require('fs');

const REPORT_PATH = 'playwright-report/results.json';
const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_TXT = 'changed-tests.txt';
const SUMMARY_PATH = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON)) {
    const data = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON, 'utf-8'));

    return {
      added: data.added || [],
      modified: data.modified || [],
      all: data.all || [],
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_TXT)) {
    return { added: [], modified: [], all: [] };
  }

  const all = fs
    .readFileSync(CHANGED_TESTS_TXT, 'utf-8')
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  return { added: [], modified: all, all };
}

function normalizeSpecPath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');

  if (normalized.startsWith('framework/tests/')) {
    return normalized;
  }

  if (normalized.includes('/framework/tests/')) {
    return normalized.slice(normalized.indexOf('framework/tests/'));
  }

  return `framework/tests/${normalized.replace(/^\/+/, '')}`;
}

function possibleReason(message = '', status = '') {
  const lower = `${message} ${status}`.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('strict mode violation') ||
    lower.includes('waiting for')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect') ||
    lower.includes('assert') ||
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
    lower.includes('network') ||
    lower.includes('response')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('page.goto') ||
    lower.includes('tohaveurl')
  ) {
    return 'navigation failure';
  }

  return 'test execution failure';
}

function collectSpecOutcomes(suites = [], changedTests = new Set(), outcomes = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const specPath = normalizeSpecPath(spec.file);

      if (!changedTests.has(specPath)) {
        continue;
      }

      const failedMessages = [];
      let hasUnexpectedStatus = false;
      let hasExecutedResult = false;

      for (const test of spec.tests || []) {
        const results = test.results || [];
        const finalResult = results[results.length - 1];

        if (finalResult) {
          hasExecutedResult = true;
        }

        const finalStatus = finalResult?.status || test.outcome || '';
        const failedOutcome = test.outcome === 'unexpected';
        const failedStatus = ['failed', 'timedOut', 'interrupted'].includes(finalStatus);

        if (failedOutcome || failedStatus) {
          hasUnexpectedStatus = true;
          failedMessages.push(finalResult?.error?.message || finalStatus);
        }
      }

      outcomes.set(specPath, {
        failed: hasUnexpectedStatus,
        reason: possibleReason(failedMessages.join('\n')),
        executed: hasExecutedResult,
      });
    }

    collectSpecOutcomes(suite.suites || [], changedTests, outcomes);
  }

  return outcomes;
}

function renderList(files) {
  if (files.length === 0) {
    return ['None detected.'];
  }

  return files.map((file) => `* ${file}`);
}

function renderSection(title, files, outcomes) {
  const lines = [`${title}:`, ...renderList(files), '', 'Result:'];

  if (files.length === 0) {
    lines.push('No in-scope tests in this category.');
    return lines;
  }

  const failed = files.filter((file) => outcomes.get(file)?.failed);
  const missing = files.filter((file) => !outcomes.has(file));

  if (failed.length === 0 && missing.length === 0) {
    lines.push(
      title === 'Added tests'
        ? 'All newly added tests passed successfully.'
        : 'Modified tests passed successfully without detected issues.',
    );
    return lines;
  }

  if (failed.length > 0) {
    lines.push(
      title === 'Added tests'
        ? 'New tests failed during execution.'
        : 'Regression failed.',
      '',
      'Possible reasons:',
    );

    const reasons = Array.from(
      new Set(failed.map((file) => outcomes.get(file)?.reason || 'test execution failure')),
    );
    reasons.forEach((reason) => lines.push(`* ${reason}`));
  }

  if (missing.length > 0) {
    if (failed.length > 0) {
      lines.push('');
    }

    lines.push('Some changed tests did not produce execution results.');
  }

  return lines;
}

const changedTests = readChangedTests();
const changedTestSet = new Set(changedTests.all);
let outcomes = new Map();

if (fs.existsSync(REPORT_PATH) && changedTestSet.size > 0) {
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  outcomes = collectSpecOutcomes(report.suites || [], changedTestSet);
}

const lines = [
  'Lightweight QA Regression Summary',
  '',
  ...renderSection('Added tests', changedTests.added, outcomes),
  '',
  ...renderSection('Modified tests', changedTests.modified, outcomes),
];

if (changedTests.all.length === 0) {
  lines.push('', 'Overall result:', 'No regression execution required.');
}

if (process.env.GITHUB_RUN_ID && process.env.GITHUB_REPOSITORY) {
  lines.push(
    '',
    'GitHub Actions Run:',
    `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  );
}

const summary = `${lines.join('\n')}\n`;
fs.writeFileSync(SUMMARY_PATH, summary);
console.log(summary);
