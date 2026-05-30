const fs = require('fs');

const changedTestsJsonPath = 'changed-tests.json';
const changedTestsTextPath = 'changed-tests.txt';
const reportPath = 'playwright-report/results.json';
const summaryPath = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(changedTestsJsonPath)) {
    const changedTests = JSON.parse(fs.readFileSync(changedTestsJsonPath, 'utf-8'));

    return {
      added: changedTests.added || [],
      modified: changedTests.modified || [],
    };
  }

  if (!fs.existsSync(changedTestsTextPath)) {
    return { added: [], modified: [] };
  }

  const modified = fs
    .readFileSync(changedTestsTextPath, 'utf-8')
    .split('\n')
    .map((test) => test.trim())
    .filter(Boolean);

  return { added: [], modified };
}

function normalizeSpecFile(filePath = '') {
  const normalized = filePath.replace(/\\/g, '/');
  const marker = '/framework/tests/';
  const markerIndex = normalized.indexOf(marker);

  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + 1);
  }

  if (normalized.startsWith('framework/tests/')) {
    return normalized;
  }

  return `framework/tests/${normalized}`;
}

function classifyPossibleReason(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('selector') ||
    lower.includes('test id') ||
    lower.includes('element(s) not found')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect(') ||
    lower.includes('expected') ||
    lower.includes('assert') ||
    lower.includes('tohave') ||
    lower.includes('tocontain')
  ) {
    return 'assertion mismatch';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::') ||
    lower.includes('econnreset') ||
    lower.includes('api') ||
    lower.includes('request') ||
    lower.includes('response')
  ) {
    return 'API/network issue';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('waiting for url') ||
    lower.includes('tohaveurl') ||
    lower.includes('load state')
  ) {
    return 'navigation failure';
  }

  return 'page state issue';
}

function lastFailureMessage(results = []) {
  const finalFailure = [...results]
    .reverse()
    .find((result) => result.status !== 'passed' && result.status !== 'skipped');

  return finalFailure?.error?.message || finalFailure?.errors?.[0]?.message || '';
}

function collectSpecResults(suites = [], specResults = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const file = normalizeSpecFile(spec.file);
      const existing = specResults.get(file) || {
        status: 'passed',
        reasons: new Set(),
      };

      for (const test of spec.tests || []) {
        const status = test.status || test.results?.at(-1)?.status || 'unknown';

        if (!['passed', 'skipped', 'expected'].includes(status)) {
          existing.status = 'failed';
          existing.reasons.add(classifyPossibleReason(lastFailureMessage(test.results)));
        }
      }

      specResults.set(file, existing);
    }

    collectSpecResults(suite.suites || [], specResults);
  }

  return specResults;
}

function formatList(files) {
  if (files.length === 0) {
    return 'None\n';
  }

  return files.map((file) => `* ${file}`).join('\n') + '\n';
}

function summarizeGroup(label, files, successMessage, failureMessage, specResults, hasReport) {
  let summary = `${label}:\n${formatList(files)}\n`;

  if (files.length === 0) {
    return summary;
  }

  const failedFiles = files.filter((file) => specResults.get(file)?.status === 'failed');
  const missingFiles = files.filter((file) => !specResults.has(file));

  summary += 'Result:\n';

  if (!hasReport || missingFiles.length > 0) {
    summary += 'Regression result unavailable.\n\n';
    return summary;
  }

  if (failedFiles.length === 0) {
    summary += `${successMessage}\n\n`;
    return summary;
  }

  const reasons = new Set();
  failedFiles.forEach((file) => {
    for (const reason of specResults.get(file)?.reasons || []) {
      reasons.add(reason);
    }
  });

  summary += `${failureMessage}\n\n`;
  summary += 'Possible reasons:\n';
  Array.from(reasons)
    .sort()
    .forEach((reason) => {
      summary += `* ${reason}\n`;
    });
  summary += '\n';

  return summary;
}

const changedTests = readChangedTests();
const allChangedTests = [...changedTests.added, ...changedTests.modified];
const hasReport = fs.existsSync(reportPath);
const report = hasReport ? JSON.parse(fs.readFileSync(reportPath, 'utf-8')) : null;
const specResults = report ? collectSpecResults(report.suites || []) : new Map();

let summary = 'Lightweight QA Regression Summary\n\n';

if (allChangedTests.length === 0) {
  summary += 'No added or modified Playwright tests detected.\n\n';
  summary += 'Result:\nNo regression execution required.\n';
} else {
  summary += summarizeGroup(
    'Added tests',
    changedTests.added,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    specResults,
    hasReport
  );
  summary += summarizeGroup(
    'Modified tests',
    changedTests.modified,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    specResults,
    hasReport
  );
}

if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
  summary += `GitHub Actions Run:\nhttps://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;
}

fs.writeFileSync(summaryPath, summary);
console.log(summary);
