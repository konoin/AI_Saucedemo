const fs = require('fs');
const path = require('path');

const reportPath = 'playwright-report/results.json';
const changedTestsJsonPath = 'changed-tests.json';
const changedTestsTextPath = 'changed-tests.txt';
const outputPath = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(changedTestsJsonPath)) {
    const changedTests = JSON.parse(fs.readFileSync(changedTestsJsonPath, 'utf-8'));

    return {
      added: changedTests.added || [],
      modified: changedTests.modified || [],
      all: changedTests.all || [],
    };
  }

  if (!fs.existsSync(changedTestsTextPath)) {
    return { added: [], modified: [], all: [] };
  }

  const all = fs
    .readFileSync(changedTestsTextPath, 'utf-8')
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  return { added: [], modified: all, all };
}

function normalizeFile(file) {
  if (!file) {
    return '';
  }

  return path.relative(process.cwd(), path.resolve(file)).replace(/\\/g, '/');
}

function readErrorMessage(result = {}) {
  if (result.error?.message) {
    return result.error.message;
  }

  if (Array.isArray(result.errors) && result.errors[0]?.message) {
    return result.errors[0].message;
  }

  return '';
}

function classifyPossibleCause(message = '', status = '') {
  const lower = `${message} ${status}`.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('selector') ||
    lower.includes('element') ||
    lower.includes('strict mode')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect') ||
    lower.includes('expected') ||
    lower.includes('received') ||
    lower.includes('assert')
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
    lower.includes('request') ||
    lower.includes('response')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('goto') ||
    lower.includes('load state') ||
    lower.includes('page closed')
  ) {
    return 'navigation failure';
  }

  return 'page state issue';
}

function collectFailures(suites = [], changedFiles = new Set()) {
  const failures = [];
  const failedStatuses = new Set(['failed', 'timedOut', 'interrupted']);

  function visit(suiteList = []) {
    for (const suite of suiteList) {
      for (const spec of suite.specs || []) {
        const file = normalizeFile(spec.file);

        if (!changedFiles.has(file)) {
          continue;
        }

        for (const test of spec.tests || []) {
          const results = test.results || [];
          const finalResult = results[results.length - 1];

          if (!finalResult || !failedStatuses.has(finalResult.status)) {
            continue;
          }

          failures.push({
            file,
            cause: classifyPossibleCause(
              readErrorMessage(finalResult),
              finalResult.status,
            ),
          });
        }
      }

      visit(suite.suites || []);
    }
  }

  visit(suites);

  return failures;
}

function readReport() {
  if (!fs.existsSync(reportPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

function readTestOutput() {
  if (!fs.existsSync('test-output.txt')) {
    return '';
  }

  return fs.readFileSync('test-output.txt', 'utf-8');
}

function unique(values) {
  return [...new Set(values)].sort();
}

function formatFileList(files) {
  return files.map((file) => `* ${file}`).join('\n') + '\n\n';
}

function buildGroupSummary({
  label,
  files,
  failures,
  reportAvailable,
  successText,
  failureText,
}) {
  if (files.length === 0) {
    return '';
  }

  let summary = `${label}:\n\n`;
  summary += formatFileList(files);
  summary += 'Result:\n';

  if (!reportAvailable) {
    summary += 'Execution result unavailable; Playwright JSON report was not generated.\n\n';
    return summary;
  }

  if (failures.length === 0) {
    summary += `${successText}\n\n`;
    return summary;
  }

  summary += `${failureText}\n\n`;
  summary += 'Possible reasons:\n';
  unique(failures.map((failure) => failure.cause)).forEach((cause) => {
    summary += `* ${cause}\n`;
  });
  summary += '\n';

  return summary;
}

const changedTests = readChangedTests();
const changedFiles = new Set(changedTests.all);
const report = readReport();
const reportAvailable = Boolean(report);
const testOutput = readTestOutput();
let failures = [];

if (report) {
  failures = collectFailures(report.suites || [], changedFiles);

  if (report.status !== 'passed' && failures.length === 0) {
    failures = changedTests.all.map((file) => ({
      file,
      cause: classifyPossibleCause(testOutput, report.status),
    }));
  }
}

const addedFailures = failures.filter((failure) =>
  changedTests.added.includes(failure.file),
);
const modifiedFailures = failures.filter((failure) =>
  changedTests.modified.includes(failure.file),
);

let summary = 'Lightweight QA Regression Summary\n\n';

summary += `Repository: ${process.env.GITHUB_REPOSITORY || 'local'}\n`;
summary += `Branch: ${process.env.GITHUB_REF_NAME || 'local'}\n`;
summary += `Triggered by: ${process.env.GITHUB_ACTOR || 'local'}\n`;
summary += `Date: ${new Date().toISOString()}\n\n`;

if (changedTests.all.length === 0) {
  summary += 'No added or modified Playwright tests detected.\n\n';
} else {
  summary += buildGroupSummary({
    label: 'Added tests',
    files: changedTests.added,
    failures: addedFailures,
    reportAvailable,
    successText: 'All newly added tests passed successfully.',
    failureText: 'New tests failed during execution.',
  });
  summary += buildGroupSummary({
    label: 'Modified tests',
    files: changedTests.modified,
    failures: modifiedFailures,
    reportAvailable,
    successText: 'Modified tests passed successfully without detected issues.',
    failureText: 'Regression failed.',
  });
}

if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
  summary += 'GitHub Actions Run:\n';
  summary += `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;
}

fs.writeFileSync(outputPath, summary, 'utf-8');
console.log(summary);
