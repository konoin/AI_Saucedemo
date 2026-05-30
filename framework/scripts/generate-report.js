const fs = require('fs');
const path = require('path');

const reportPath = 'playwright-report/results.json';
const changedTestsPath = 'changed-tests.json';
const summaryPath = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(changedTestsPath)) {
    const changedTests = JSON.parse(fs.readFileSync(changedTestsPath, 'utf-8'));

    return {
      added: changedTests.added || [],
      modified: changedTests.modified || [],
      all: changedTests.all || [],
    };
  }

  if (!fs.existsSync('changed-tests.txt')) {
    return { added: [], modified: [], all: [] };
  }

  const all = fs
    .readFileSync('changed-tests.txt', 'utf-8')
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  return { added: [], modified: all, all };
}

function normalizeFile(file, rootDir = 'framework/tests') {
  if (!file) {
    return '';
  }

  const normalizedFile = file.replace(/\\/g, '/');

  if (path.isAbsolute(normalizedFile)) {
    return path.relative(process.cwd(), normalizedFile).replace(/\\/g, '/');
  }

  if (normalizedFile.startsWith('framework/tests/')) {
    return normalizedFile;
  }

  const relativeRoot = path
    .relative(process.cwd(), path.resolve(rootDir))
    .replace(/\\/g, '/');

  return path.join(relativeRoot, normalizedFile).replace(/\\/g, '/');
}

function getResultError(result = {}) {
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

function collectFailures(suites = [], changedFiles = new Set(), rootDir = 'framework/tests') {
  const failures = [];
  const failedStatuses = new Set(['failed', 'timedOut', 'interrupted']);

  function visit(suiteList = []) {
    for (const suite of suiteList) {
      for (const spec of suite.specs || []) {
        const file = normalizeFile(spec.file, rootDir);

        if (!changedFiles.has(file)) {
          continue;
        }

        for (const test of spec.tests || []) {
          const results = test.results || [];
          const finalResult = results[results.length - 1];

          if (!finalResult || !failedStatuses.has(finalResult.status)) {
            continue;
          }

          const message = getResultError(finalResult);

          failures.push({
            file,
            title: spec.title,
            project: test.projectName,
            cause: classifyPossibleCause(message, finalResult.status),
          });
        }
      }

      visit(suite.suites || []);
    }
  }

  visit(suites);

  return failures;
}

function formatFiles(files) {
  if (files.length === 0) {
    return '- None\n';
  }

  return files.map((file) => `- ${file}`).join('\n') + '\n';
}

function unique(values) {
  return [...new Set(values)].sort();
}

function buildGroupSummary(label, files, failures, reportAvailable, successText, failureText) {
  let groupSummary = `${label}:\n`;
  groupSummary += formatFiles(files);

  if (files.length === 0) {
    return `${groupSummary}\n`;
  }

  groupSummary += '\nResult:\n';

  if (!reportAvailable) {
    groupSummary += 'Execution result unavailable; Playwright JSON report was not generated.\n\n';
    return groupSummary;
  }

  if (failures.length === 0) {
    groupSummary += `${successText}\n\n`;
    return groupSummary;
  }

  groupSummary += `${failureText}\n\n`;
  groupSummary += 'Possible reasons:\n';
  unique(failures.map((failure) => failure.cause)).forEach((cause) => {
    groupSummary += `- ${cause}\n`;
  });

  return `${groupSummary}\n`;
}

const changedTests = readChangedTests();
const changedFiles = new Set(changedTests.all);
const reportAvailable = fs.existsSync(reportPath);
let failures = [];

if (reportAvailable) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  failures = collectFailures(report.suites || [], changedFiles, report.config?.rootDir);
}

const addedFailures = failures.filter((failure) => changedTests.added.includes(failure.file));
const modifiedFailures = failures.filter((failure) =>
  changedTests.modified.includes(failure.file),
);

let summary = 'Lightweight QA Regression Summary\n\n';

summary += `Repository: ${process.env.GITHUB_REPOSITORY || 'local'}\n`;
summary += `Branch: ${process.env.GITHUB_REF_NAME || 'local'}\n`;
summary += `Triggered by: ${process.env.GITHUB_ACTOR || 'local'}\n`;
summary += `Date: ${new Date().toISOString()}\n\n`;

if (changedTests.all.length === 0) {
  summary += 'No added or modified Playwright tests detected.\n';
} else {
  summary += buildGroupSummary(
    'Added tests',
    changedTests.added,
    addedFailures,
    reportAvailable,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
  );
  summary += buildGroupSummary(
    'Modified tests',
    changedTests.modified,
    modifiedFailures,
    reportAvailable,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
  );
}

if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
  summary += 'GitHub Actions Run:\n';
  summary += `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;
}

fs.writeFileSync(summaryPath, summary, 'utf-8');
console.log(summary);
