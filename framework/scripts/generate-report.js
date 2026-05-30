const fs = require('fs');

const changedTestsJsonPath = 'changed-tests.json';
const changedTestsTextPath = 'changed-tests.txt';
const reportPath = 'playwright-report/results.json';
const summaryPath = 'qa-regression-summary.txt';

function normalizeTestPath(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');
  const marker = 'framework/tests/';
  const markerIndex = normalized.lastIndexOf(marker);

  if (markerIndex >= 0) {
    return normalized.slice(markerIndex);
  }

  if (normalized.startsWith('tests/')) {
    return `framework/${normalized}`;
  }

  if (/^[^/]+\.(spec|test)\.ts$/.test(normalized)) {
    return `framework/tests/${normalized}`;
  }

  return normalized;
}

function displayTestPath(filePath) {
  return normalizeTestPath(filePath).replace(/^framework\/tests\//, '');
}

function readChangedTests() {
  if (fs.existsSync(changedTestsJsonPath)) {
    const changedTests = JSON.parse(
      fs.readFileSync(changedTestsJsonPath, 'utf-8'),
    );

    return {
      added: (changedTests.added || []).map(normalizeTestPath),
      modified: (changedTests.modified || []).map(normalizeTestPath),
    };
  }

  if (fs.existsSync(changedTestsTextPath)) {
    return {
      added: [],
      modified: fs
        .readFileSync(changedTestsTextPath, 'utf-8')
        .split('\n')
        .map((line) => normalizeTestPath(line.trim()))
        .filter(Boolean),
    };
  }

  return { added: [], modified: [] };
}

function classifyReason(message = '', status = '') {
  const lower = `${message} ${status}`.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('selector') ||
    lower.includes('element not found') ||
    lower.includes('strict mode violation')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect') ||
    lower.includes('tohave') ||
    lower.includes('expected') ||
    lower.includes('received')
  ) {
    return 'assertion mismatch';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::') ||
    lower.includes('network') ||
    lower.includes('econn') ||
    lower.includes('api') ||
    lower.includes('response')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('page.goto') ||
    lower.includes('load state')
  ) {
    return 'navigation failure';
  }

  return 'execution failure';
}

function getFailedResult(test) {
  const testStatus = test.status || test.outcome;
  const failedStatuses = new Set(['failed', 'interrupted', 'timedOut']);
  const failedOutcomes = new Set(['unexpected', 'failed']);
  const results = test.results || [];

  if (testStatus && !failedOutcomes.has(testStatus)) {
    return null;
  }

  const finalResult = results[results.length - 1];

  if (finalResult && failedStatuses.has(finalResult.status)) {
    return finalResult;
  }

  if (testStatus && failedOutcomes.has(testStatus)) {
    return results.find((result) => failedStatuses.has(result.status)) || {};
  }

  return null;
}

function addFailure(failuresByFile, filePath, reason) {
  const normalizedPath = normalizeTestPath(filePath);

  if (!failuresByFile.has(normalizedPath)) {
    failuresByFile.set(normalizedPath, new Set());
  }

  failuresByFile.get(normalizedPath).add(reason);
}

function collectFailures(suites = [], failuresByFile = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const specFile = normalizeTestPath(spec.file || suite.file || '');

      for (const test of spec.tests || []) {
        const failedResult = getFailedResult(test);

        if (!failedResult) {
          continue;
        }

        const message =
          failedResult.error?.message ||
          failedResult.errors?.map((error) => error.message).join('\n') ||
          '';
        const reason = classifyReason(message, failedResult.status);
        addFailure(failuresByFile, specFile, reason);
      }
    }

    collectFailures(suite.suites || [], failuresByFile);
  }

  return failuresByFile;
}

function readRegressionFailures() {
  if (!fs.existsSync(reportPath)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  return collectFailures(report.suites || []);
}

function appendList(summaryParts, files) {
  if (files.length === 0) {
    summaryParts.push('None detected.');
    return;
  }

  files.forEach((filePath) => {
    summaryParts.push(`* ${displayTestPath(filePath)}`);
  });
}

function appendResult(summaryParts, files, failuresByFile, passMessage, failMessage) {
  if (files.length === 0) {
    return;
  }

  summaryParts.push('', 'Result:');

  if (!failuresByFile) {
    summaryParts.push('Execution result was not available.');
    return;
  }

  const possibleReasons = new Set();

  files.forEach((filePath) => {
    const reasons = failuresByFile.get(normalizeTestPath(filePath));

    if (!reasons) {
      return;
    }

    reasons.forEach((reason) => possibleReasons.add(reason));
  });

  if (possibleReasons.size === 0) {
    summaryParts.push(passMessage);
    return;
  }

  summaryParts.push(failMessage, '', 'Possible reasons:');
  possibleReasons.forEach((reason) => {
    summaryParts.push(`* ${reason}`);
  });
}

function buildSummary(changedTests, failuresByFile) {
  const added = changedTests.added;
  const modified = changedTests.modified;
  const summaryParts = ['Lightweight QA Regression Summary', ''];

  if (added.length === 0 && modified.length === 0) {
    summaryParts.push(
      'No added or modified Playwright tests detected under framework/tests.',
      '',
      'Result:',
      'No regression execution required.',
    );
  } else {
    summaryParts.push('Added tests:');
    appendList(summaryParts, added);
    appendResult(
      summaryParts,
      added,
      failuresByFile,
      'All newly added tests passed successfully.',
      'New tests failed during execution.',
    );

    summaryParts.push('', 'Modified tests:');
    appendList(summaryParts, modified);
    appendResult(
      summaryParts,
      modified,
      failuresByFile,
      'Modified tests passed successfully without detected issues.',
      'Regression failed.',
    );
  }

  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
    summaryParts.push(
      '',
      'GitHub Actions Run:',
      `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    );
  }

  return `${summaryParts.join('\n')}\n`;
}

const changedTests = readChangedTests();
const failuresByFile = readRegressionFailures();
const summary = buildSummary(changedTests, failuresByFile);

fs.writeFileSync(summaryPath, summary, 'utf-8');
console.log(summary);
