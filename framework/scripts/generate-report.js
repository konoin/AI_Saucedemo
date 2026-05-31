const fs = require('fs');

const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_TXT = 'changed-tests.txt';
const PLAYWRIGHT_REPORT_JSON = 'playwright-report/results.json';
const SUMMARY_PATH = 'qa-regression-summary.txt';

function normalizePath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\.\//, '').trim();
  const frameworkIndex = normalized.indexOf('framework/tests/');

  if (frameworkIndex >= 0) {
    return normalized.slice(frameworkIndex);
  }

  return normalized.startsWith('framework/')
    ? normalized
    : `framework/tests/${normalized}`;
}

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON)) {
    const parsed = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON, 'utf-8'));

    return {
      added: parsed.added || [],
      modified: parsed.modified || [],
      all: parsed.all || [],
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_TXT)) {
    return { added: [], modified: [], all: [] };
  }

  const all = fs
    .readFileSync(CHANGED_TESTS_TXT, 'utf-8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return { added: [], modified: all, all };
}

function classifyError(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('selector') ||
    lower.includes('element') ||
    lower.includes('strict mode violation')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect(') ||
    lower.includes('assertion') ||
    lower.includes('tohave') ||
    lower.includes('tobe') ||
    lower.includes('tocontain')
  ) {
    return 'assertion mismatch';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::') ||
    lower.includes('econn') ||
    lower.includes('api') ||
    lower.includes('request failed') ||
    lower.includes('response')
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

  return 'page state issue';
}

function finalResultFor(test = {}) {
  const results = test.results || [];
  const failedResult = [...results]
    .reverse()
    .find((result) => ['failed', 'timedOut', 'interrupted'].includes(result.status));
  const finalResult = results[results.length - 1] || {};
  const outcome = test.outcome || finalResult.status || 'unknown';
  const failed = outcome === 'unexpected' || ['failed', 'timedOut', 'interrupted'].includes(finalResult.status);
  const errorMessage = failedResult?.error?.message || failedResult?.errors?.[0]?.message || '';

  return {
    failed,
    skipped: outcome === 'skipped' || finalResult.status === 'skipped',
    reason: failed ? classifyError(errorMessage) : null,
  };
}

function collectOutcomes(report) {
  const outcomes = new Map();

  function ensureFile(filePath) {
    const normalizedFile = normalizePath(filePath);

    if (!outcomes.has(normalizedFile)) {
      outcomes.set(normalizedFile, {
        failed: false,
        skipped: true,
        reasons: new Set(),
      });
    }

    return outcomes.get(normalizedFile);
  }

  function visitSuites(suites = []) {
    for (const suite of suites) {
      for (const spec of suite.specs || []) {
        const fileOutcome = ensureFile(spec.file || suite.file || '');

        for (const test of spec.tests || []) {
          const result = finalResultFor(test);

          if (!result.skipped) {
            fileOutcome.skipped = false;
          }

          if (result.failed) {
            fileOutcome.failed = true;
            fileOutcome.skipped = false;
            fileOutcome.reasons.add(result.reason);
          }
        }
      }

      visitSuites(suite.suites || []);
    }
  }

  visitSuites(report.suites || []);

  return outcomes;
}

function loadOutcomes() {
  if (!fs.existsSync(PLAYWRIGHT_REPORT_JSON)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(PLAYWRIGHT_REPORT_JSON, 'utf-8'));
  return collectOutcomes(report);
}

function appendTestList(lines, label, tests) {
  lines.push(`${label}:`);

  if (tests.length === 0) {
    lines.push('- None');
  } else {
    tests.forEach((test) => lines.push(`- ${test}`));
  }

  lines.push('');
}

function groupStatus(tests, outcomes) {
  if (!outcomes) {
    return { status: 'unknown', reasons: ['test result unavailable'] };
  }

  const reasons = new Set();
  let hasFailure = false;
  let missingResult = false;

  for (const test of tests) {
    const outcome = outcomes.get(normalizePath(test));

    if (!outcome) {
      missingResult = true;
      continue;
    }

    if (outcome.failed) {
      hasFailure = true;
      outcome.reasons.forEach((reason) => reasons.add(reason));
    }
  }

  if (hasFailure) {
    return { status: 'failed', reasons: [...reasons] };
  }

  if (missingResult) {
    return { status: 'unknown', reasons: ['test result unavailable'] };
  }

  return { status: 'passed', reasons: [] };
}

function appendResult(lines, group, tests, outcomes) {
  if (tests.length === 0) {
    return;
  }

  const status = groupStatus(tests, outcomes);
  lines.push('Result:');

  if (status.status === 'passed') {
    lines.push(
      group === 'added'
        ? 'All newly added tests passed successfully.'
        : 'Modified tests passed successfully without detected issues.',
    );
    lines.push('');
    return;
  }

  if (status.status === 'failed') {
    lines.push(group === 'added' ? 'New tests failed during execution.' : 'Regression failed.');
    lines.push('');
    lines.push('Possible reasons:');
    status.reasons.forEach((reason) => lines.push(`- ${reason}`));
    lines.push('');
    return;
  }

  lines.push('Regression result unavailable.');
  lines.push('');
  lines.push('Possible reasons:');
  status.reasons.forEach((reason) => lines.push(`- ${reason}`));
  lines.push('');
}

const changedTests = readChangedTests();
const outcomes = loadOutcomes();
const lines = ['Lightweight QA Regression Summary', ''];

if (changedTests.all.length === 0) {
  lines.push('No added or modified Playwright tests detected.', '');
  lines.push('Result:', 'No regression execution required.', '');
} else {
  appendTestList(lines, 'Added tests', changedTests.added);
  appendResult(lines, 'added', changedTests.added, outcomes);
  appendTestList(lines, 'Modified tests', changedTests.modified);
  appendResult(lines, 'modified', changedTests.modified, outcomes);
}

const summary = `${lines.join('\n').trim()}\n`;

fs.writeFileSync(SUMMARY_PATH, summary, 'utf-8');
console.log(summary);
