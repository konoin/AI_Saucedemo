const fs = require('fs');
const path = require('path');

const REPORT_PATH = 'playwright-report/results.json';
const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_FILE = 'changed-tests.txt';
const QA_SUMMARY_FILE = 'qa-regression-summary.txt';

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON)) {
    const changedTests = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON, 'utf-8'));

    return {
      added: changedTests.added || [],
      modified: changedTests.modified || [],
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_FILE)) {
    return { added: [], modified: [] };
  }

  const changedTests = fs
    .readFileSync(CHANGED_TESTS_FILE, 'utf-8')
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);

  return { added: [], modified: changedTests };
}

function normalizeTestPath(file = '') {
  const normalized = file.replace(/\\/g, '/');
  const frameworkIndex = normalized.indexOf('framework/tests/');

  if (frameworkIndex >= 0) {
    return normalized.slice(frameworkIndex);
  }

  if (path.isAbsolute(normalized)) {
    return path.relative(process.cwd(), normalized).replace(/\\/g, '/');
  }

  if (!normalized.includes('/')) {
    return `framework/tests/${normalized}`;
  }

  return normalized.replace(/^\.\//, '');
}

function possibleCause(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('selector') ||
    lower.includes('strict mode violation') ||
    lower.includes('element(s) not found')
  ) {
    return 'locator not found';
  }

  if (
    lower.includes('expect') ||
    lower.includes('expected') ||
    lower.includes('received') ||
    lower.includes('tohavetext') ||
    lower.includes('tocontaintext')
  ) {
    return 'assertion mismatch';
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'timeout exceeded';
  }

  if (
    lower.includes('net::err') ||
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
    lower.includes('url')
  ) {
    return 'navigation failure';
  }

  return 'test execution failure';
}

function collectSpecResults(suites = [], results = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const file = normalizeTestPath(spec.file);
      const existing = results.get(file) || {
        failed: false,
        causes: new Set(),
      };

      for (const test of spec.tests || []) {
        const attempts = test.results || [];
        const finalResult = attempts[attempts.length - 1];
        const failed =
          test.status === 'unexpected' || finalResult?.status === 'failed';

        if (failed) {
          existing.failed = true;
          existing.causes.add(possibleCause(finalResult?.error?.message));
        }
      }

      results.set(file, existing);
    }

    collectSpecResults(suite.suites || [], results);
  }

  return results;
}

function basenameList(files) {
  return files.map((file) => `* ${path.basename(file)}`).join('\n');
}

function addResultSection(lines, title, files, passedMessage, failedMessage, results) {
  lines.push(`${title}:`);

  if (files.length === 0) {
    lines.push('* None', '');
    return;
  }

  lines.push(basenameList(files), '', 'Result:');

  const failedFiles = files.filter((file) => results.get(file)?.failed);

  if (failedFiles.length === 0) {
    lines.push(passedMessage, '');
    return;
  }

  lines.push(failedMessage, '', 'Possible reasons:');

  const causes = [
    ...new Set(
      failedFiles.flatMap((file) => [...(results.get(file)?.causes || [])]),
    ),
  ];

  (causes.length ? causes : ['test execution failure']).forEach((cause) => {
    lines.push(`* ${cause}`);
  });

  lines.push('');
}

function generateSummary() {
  const changedTests = readChangedTests();
  const allChangedTests = [...changedTests.added, ...changedTests.modified];
  const lines = ['Lightweight QA Regression Summary', ''];

  if (allChangedTests.length === 0) {
    lines.push(
      'No added or modified Playwright tests detected under framework/tests.',
      '',
      'Result:',
      'No regression execution required.',
      '',
    );

    return lines.join('\n');
  }

  if (!fs.existsSync(REPORT_PATH)) {
    addResultSection(
      lines,
      'Added tests',
      changedTests.added,
      'Regression result unavailable.',
      'New tests failed during execution.',
      new Map(),
    );
    addResultSection(
      lines,
      'Modified tests',
      changedTests.modified,
      'Regression result unavailable.',
      'Regression failed.',
      new Map(),
    );

    return lines.join('\n');
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  const results = collectSpecResults(report.suites || []);

  addResultSection(
    lines,
    'Added tests',
    changedTests.added,
    'All newly added tests passed successfully.',
    'New tests failed during execution.',
    results,
  );
  addResultSection(
    lines,
    'Modified tests',
    changedTests.modified,
    'Modified tests passed successfully without detected issues.',
    'Regression failed.',
    results,
  );

  return lines.join('\n');
}

const summary = generateSummary();

fs.writeFileSync(QA_SUMMARY_FILE, summary, 'utf-8');
console.log(summary);
