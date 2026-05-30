const fs = require('fs');
const path = require('path');

const CHANGED_TESTS_PATH = 'changed-tests.json';
const REPORT_PATH = process.env.PLAYWRIGHT_JSON_REPORT || 'playwright-report/results.json';
const SUMMARY_PATH = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(CHANGED_TESTS_PATH, 'utf-8'));

    return {
      added: parsed.added || [],
      modified: parsed.modified || [],
      all: parsed.all || [...(parsed.added || []), ...(parsed.modified || [])],
    };
  }

  if (fs.existsSync('changed-tests.txt')) {
    const tests = fs
      .readFileSync('changed-tests.txt', 'utf-8')
      .split('\n')
      .map(file => file.trim())
      .filter(Boolean);

    return {
      added: [],
      modified: tests,
      all: tests,
    };
  }

  return {
    added: [],
    modified: [],
    all: [],
  };
}

function normalizeTestPath(file) {
  if (!file) {
    return '';
  }

  let normalized = file.replace(/\\/g, '/');

  if (path.isAbsolute(normalized)) {
    normalized = path.relative(process.cwd(), normalized).replace(/\\/g, '/');
  }

  if (normalized.startsWith('framework/tests/')) {
    return normalized;
  }

  if (normalized.startsWith('tests/')) {
    return `framework/${normalized}`;
  }

  return `framework/tests/${normalized}`;
}

function classifyReason(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('strict mode violation') ||
    lower.includes('waiting for')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect(') ||
    lower.includes('expected') ||
    lower.includes('tohavetext') ||
    lower.includes('tocontaintext') ||
    lower.includes('assert')
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
    lower.includes('network')
  ) {
    return 'API/network failure';
  }

  if (
    lower.includes('navigation') ||
    lower.includes('page.goto') ||
    lower.includes('url') ||
    lower.includes('load state')
  ) {
    return 'navigation failure';
  }

  return 'page state issue';
}

function didTestFail(test) {
  if (['unexpected', 'failed', 'timedOut', 'interrupted'].includes(test.status)) {
    return true;
  }

  const results = test.results || [];
  const finalResult = results[results.length - 1];

  return ['failed', 'timedOut', 'interrupted'].includes(finalResult?.status);
}

function collectFailures(suites = [], changedTestSet, failures = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const normalizedFile = normalizeTestPath(spec.file);

      if (!changedTestSet.has(normalizedFile)) {
        continue;
      }

      for (const test of spec.tests || []) {
        if (!didTestFail(test)) {
          continue;
        }

        const resultWithError = [...(test.results || [])]
          .reverse()
          .find(result => result.error?.message);
        const errorMessage = resultWithError?.error?.message || '';
        const key = `${normalizedFile}:${spec.title}`;

        if (!failures.has(key)) {
          failures.set(key, {
            file: normalizedFile,
            title: spec.title,
            reason: classifyReason(errorMessage),
          });
        }
      }
    }

    collectFailures(suite.suites || [], changedTestSet, failures);
  }

  return failures;
}

function formatList(files) {
  if (files.length === 0) {
    return 'None\n';
  }

  return `${files.map(file => `- ${file}`).join('\n')}\n`;
}

function formatReasons(failures) {
  const reasons = [...new Set(failures.map(failure => failure.reason))];

  if (reasons.length === 0) {
    return '';
  }

  return `\nPossible reasons:\n${reasons.map(reason => `- ${reason}`).join('\n')}\n`;
}

function formatGroup(title, files, successMessage, failureMessage, failures) {
  let section = `${title}:\n${formatList(files)}\nResult:\n`;

  if (files.length === 0) {
    return `${section}No ${title.toLowerCase()} detected.\n`;
  }

  if (failures.length === 0) {
    return `${section}${successMessage}\n`;
  }

  return `${section}${failureMessage}\n${formatReasons(failures)}`;
}

const changedTests = readChangedTests();
const changedTestSet = new Set(changedTests.all.map(normalizeTestPath));
let failures = [];
let reportAvailable = false;

if (changedTests.all.length > 0 && fs.existsSync(REPORT_PATH)) {
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  failures = Array.from(collectFailures(report.suites || [], changedTestSet).values());
  reportAvailable = true;
}

let summary = 'Lightweight QA Regression Summary\n\n';

if (process.env.GITHUB_REPOSITORY) {
  summary += `Repository: ${process.env.GITHUB_REPOSITORY}\n`;
}

if (process.env.GITHUB_REF_NAME) {
  summary += `Branch: ${process.env.GITHUB_REF_NAME}\n`;
}

if (process.env.GITHUB_ACTOR) {
  summary += `Triggered by: ${process.env.GITHUB_ACTOR}\n`;
}

summary += `Date: ${new Date().toISOString()}\n\n`;

if (changedTests.all.length === 0) {
  summary += 'Added tests:\nNone\n\n';
  summary += 'Modified tests:\nNone\n\n';
  summary += 'Result:\nNo added or modified Playwright tests detected.\n';
  summary += 'No regression execution required.\n';
} else if (!reportAvailable) {
  summary += `Added tests:\n${formatList(changedTests.added)}\n`;
  summary += `Modified tests:\n${formatList(changedTests.modified)}\n`;
  summary += 'Result:\nRegression result unavailable.\n\n';
  summary += 'Possible reasons:\n- Playwright JSON report not found\n';
} else {
  const addedSet = new Set(changedTests.added.map(normalizeTestPath));
  const addedFailures = failures.filter(failure => addedSet.has(failure.file));
  const modifiedFailures = failures.filter(failure => !addedSet.has(failure.file));

  summary += `${formatGroup(
    'Added tests',
    changedTests.added,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    addedFailures,
  )}\n\n`;

  summary += `${formatGroup(
    'Modified tests',
    changedTests.modified,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    modifiedFailures,
  )}`;
}

if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
  summary += `\nGitHub Actions Run:\nhttps://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;
}

fs.writeFileSync(SUMMARY_PATH, summary);
console.log(summary);
