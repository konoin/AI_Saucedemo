const fs = require('fs');
const path = require('path');

const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_TXT = 'changed-tests.txt';
const PLAYWRIGHT_REPORT = 'playwright-report/results.json';
const QA_SUMMARY = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON)) {
    const parsed = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON, 'utf-8'));

    return {
      added: parsed.added || [],
      modified: parsed.modified || [],
      all: parsed.all || [...(parsed.added || []), ...(parsed.modified || [])],
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_TXT)) {
    return {
      added: [],
      modified: [],
      all: [],
    };
  }

  const all = fs
    .readFileSync(CHANGED_TESTS_TXT, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  return {
    added: [],
    modified: all,
    all,
  };
}

function normalizeTestPath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');
  const frameworkIndex = normalized.indexOf('framework/tests/');

  if (frameworkIndex >= 0) {
    return normalized.slice(frameworkIndex);
  }

  if (normalized.startsWith('tests/')) {
    return `framework/${normalized}`;
  }

  if (!normalized.startsWith('framework/') && /\.(spec|test)\.ts$/.test(normalized)) {
    return `framework/tests/${normalized}`;
  }

  return normalized;
}

function loadPlaywrightReport() {
  if (!fs.existsSync(PLAYWRIGHT_REPORT)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(PLAYWRIGHT_REPORT, 'utf-8'));
}

function finalResult(test = {}) {
  const results = test.results || [];
  const lastResult = results[results.length - 1] || {};
  const status = test.status || test.outcome || lastResult.status || 'unknown';

  return {
    status,
    failed: ['unexpected', 'failed', 'timedOut', 'interrupted'].includes(status) ||
      (!['expected', 'flaky', 'passed', 'skipped'].includes(status) &&
        ['failed', 'timedOut', 'interrupted'].includes(lastResult.status)),
    error: lastResult.error?.message || lastResult.errors?.[0]?.message || '',
  };
}

function classifyPossibleReason(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('waiting for selector') ||
    lower.includes('strict mode violation')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('exceeded')
  ) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('expect(') ||
    lower.includes('expected') ||
    lower.includes('received') ||
    lower.includes('tohave') ||
    lower.includes('tocontain')
  ) {
    return 'assertion mismatch';
  }

  if (
    lower.includes('net::err') ||
    lower.includes('econnreset') ||
    lower.includes('network') ||
    lower.includes('api') ||
    lower.includes('response')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('page.goto') ||
    lower.includes('goto') ||
    lower.includes('load')
  ) {
    return 'navigation failure';
  }

  return 'test execution failure';
}

function collectOutcomes(suites = [], targetPaths = new Set(), outcomes = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const filePath = normalizeTestPath(spec.file || suite.file || '');

      if (!targetPaths.has(filePath)) {
        continue;
      }

      const existing = outcomes.get(filePath) || {
        failed: false,
        reasons: new Set(),
      };

      for (const test of spec.tests || []) {
        const result = finalResult(test);

        if (result.failed) {
          existing.failed = true;
          existing.reasons.add(classifyPossibleReason(result.error));
        }
      }

      outcomes.set(filePath, existing);
    }

    collectOutcomes(suite.suites || [], targetPaths, outcomes);
  }

  return outcomes;
}

function formatList(files) {
  return files.map(file => `* ${path.basename(file)}`).join('\n');
}

function formatSection(title, files, passMessage, failMessage, outcomes, reportAvailable) {
  if (files.length === 0) {
    return '';
  }

  const failedFiles = files.filter(file => outcomes.get(file)?.failed);
  const missingFiles = files.filter(file => !outcomes.has(file));
  const lines = [`${title}:`, formatList(files), '', 'Result:'];

  if (!reportAvailable || missingFiles.length > 0) {
    lines.push('Regression result not available.');
    return `${lines.join('\n')}\n\n`;
  }

  if (failedFiles.length === 0) {
    lines.push(passMessage);
    return `${lines.join('\n')}\n\n`;
  }

  const reasons = new Set();
  failedFiles.forEach(file => {
    for (const reason of outcomes.get(file)?.reasons || []) {
      reasons.add(reason);
    }
  });

  lines.push(failMessage, '', 'Possible reasons:');
  [...reasons].forEach(reason => lines.push(`* ${reason}`));

  return `${lines.join('\n')}\n\n`;
}

const changedTests = readChangedTests();
const targetPaths = new Set(changedTests.all.map(normalizeTestPath));
const report = loadPlaywrightReport();
const outcomes = report ? collectOutcomes(report.suites || [], targetPaths) : new Map();

let summary = 'Lightweight QA Regression Summary\n\n';

if (changedTests.all.length === 0) {
  summary += 'No regression execution required.\n';
} else {
  summary += formatSection(
    'Added tests',
    changedTests.added,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    outcomes,
    Boolean(report)
  );
  summary += formatSection(
    'Modified tests',
    changedTests.modified,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    outcomes,
    Boolean(report)
  );
}

fs.writeFileSync(QA_SUMMARY, summary);
console.log(summary);
