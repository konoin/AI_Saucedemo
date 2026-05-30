const fs = require('fs');
const path = require('path');

const changedTestsPath = 'changed-tests.json';
const reportPath = 'playwright-report/results.json';
const summaryPath = 'qa-regression-summary.txt';

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function normalizeSpecPath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');
  const marker = '/framework/tests/';
  const markerIndex = normalized.indexOf(marker);

  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + 1);
  }

  if (normalized.startsWith('framework/tests/')) {
    return normalized;
  }

  if (normalized.startsWith('tests/')) {
    return `framework/${normalized}`;
  }

  if (!normalized.includes('/')) {
    return `framework/tests/${normalized}`;
  }

  return normalized;
}

function resultIsFailure(status = '') {
  return ['failed', 'timedOut', 'interrupted'].includes(status);
}

function testFailed(test) {
  if (test.status === 'unexpected') {
    return true;
  }

  const finalResult = [...(test.results || [])].reverse().find((result) => result.status !== 'skipped');
  return resultIsFailure(finalResult?.status);
}

function collectFailureCauses(test) {
  const reasons = new Set();
  const failedResults = (test.results || []).filter((result) => resultIsFailure(result.status));

  for (const result of failedResults) {
    const message = [
      result.error?.message,
      result.error?.stack,
      result.errors?.map((error) => error.message).join('\n'),
    ]
      .filter(Boolean)
      .join('\n')
      .toLowerCase();

    if (message.includes('locator') || message.includes('element(s) not found')) {
      reasons.add('locator not found');
    }

    if (message.includes('expect(') || message.includes('expected') || message.includes('received')) {
      reasons.add('assertion mismatch');
    }

    if (message.includes('timeout') || message.includes('timed out') || result.status === 'timedOut') {
      reasons.add('timeout exceeded');
    }

    if (
      message.includes('net::err') ||
      message.includes('econn') ||
      message.includes('enotfound') ||
      message.includes('api') ||
      message.includes('request failed') ||
      message.includes('waiting for response')
    ) {
      reasons.add('API/network failure');
    }

    if (message.includes('navigation') || message.includes('page.goto') || message.includes('load state')) {
      reasons.add('navigation failure');
    }
  }

  return reasons;
}

function collectSpecResults(suites = [], resultsByFile = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const filePath = normalizeSpecPath(spec.file);
      const current = resultsByFile.get(filePath) || {
        passed: 0,
        failed: 0,
        reasons: new Set(),
      };

      for (const test of spec.tests || []) {
        if (testFailed(test)) {
          current.failed += 1;
          collectFailureCauses(test).forEach((reason) => current.reasons.add(reason));
        } else {
          current.passed += 1;
        }
      }

      resultsByFile.set(filePath, current);
    }

    collectSpecResults(suite.suites || [], resultsByFile);
  }

  return resultsByFile;
}

function formatList(items) {
  return items.map((item) => `* ${item}`).join('\n');
}

function defaultFailureReason(fileResults) {
  const reasons = new Set();

  for (const result of fileResults) {
    result?.reasons?.forEach((reason) => reasons.add(reason));
  }

  if (reasons.size === 0) {
    reasons.add('page state issue');
  }

  return [...reasons].slice(0, 5);
}

function summarizeGroup(title, tests, successMessage, failureMessage, resultsByFile) {
  if (tests.length === 0) {
    return '';
  }

  const fileResults = tests.map((testPath) => resultsByFile.get(testPath));
  const missingResults = fileResults.some((result) => !result);
  const hasFailures = fileResults.some((result) => result?.failed > 0);

  let section = `${title}:\n${formatList(tests)}\n\nResult:\n`;

  if (hasFailures) {
    section += `${failureMessage}\n\nPossible reasons:\n${formatList(defaultFailureReason(fileResults))}\n`;
    return section;
  }

  if (missingResults) {
    section += 'Regression result unavailable.\n';
    return section;
  }

  section += `${successMessage}\n`;
  return section;
}

const changedTests = readJson(changedTestsPath, {
  added: [],
  modified: [],
  all: [],
});

const summarySections = ['Lightweight QA Regression Summary'];

if ((changedTests.all || []).length === 0) {
  summarySections.push(
    [
      'Changed Playwright tests:',
      'No added or modified Playwright tests detected in framework/tests.',
    ].join('\n'),
    ['Result:', 'No regression execution required.'].join('\n'),
  );
} else if (!fs.existsSync(reportPath)) {
  const addedSummary = summarizeGroup(
    'Added tests',
    changedTests.added || [],
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    new Map(),
  ).trim();
  const modifiedSummary = summarizeGroup(
    'Modified tests',
    changedTests.modified || [],
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    new Map(),
  ).trim();

  if (addedSummary) {
    summarySections.push(addedSummary);
  }

  if (modifiedSummary) {
    summarySections.push(modifiedSummary);
  }
} else {
  const report = readJson(reportPath, { suites: [] });
  const resultsByFile = collectSpecResults(report.suites || []);
  const addedSummary = summarizeGroup(
    'Added tests',
    changedTests.added || [],
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    resultsByFile,
  ).trim();
  const modifiedSummary = summarizeGroup(
    'Modified tests',
    changedTests.modified || [],
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    resultsByFile,
  ).trim();

  if (addedSummary) {
    summarySections.push(addedSummary);
  }

  if (modifiedSummary) {
    summarySections.push(modifiedSummary);
  }
}

const summary = `${summarySections.join('\n\n')}\n`;

fs.writeFileSync(path.resolve(summaryPath), summary, 'utf-8');
console.log(summary);
