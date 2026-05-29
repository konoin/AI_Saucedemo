const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    testsFile: process.env.CHANGED_TESTS_FILE || 'changed-tests.txt',
    reportFile: process.env.PLAYWRIGHT_JSON_REPORT || 'playwright-report/results.json',
    metadataFile:
      process.env.IMPACTED_RUN_METADATA || 'playwright-report/impacted-run.json',
    summaryFile: process.env.REGRESSION_SUMMARY_FILE || 'summary.txt',
    jsonSummaryFile:
      process.env.REGRESSION_JSON_SUMMARY || 'playwright-report/regression-summary.json',
    githubOutput: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--tests-file') {
      args.testsFile = argv[index + 1];
      index += 1;
    } else if (arg === '--report-file') {
      args.reportFile = argv[index + 1];
      index += 1;
    } else if (arg === '--metadata-file') {
      args.metadataFile = argv[index + 1];
      index += 1;
    } else if (arg === '--summary-file') {
      args.summaryFile = argv[index + 1];
      index += 1;
    } else if (arg === '--json-summary-file') {
      args.jsonSummaryFile = argv[index + 1];
      index += 1;
    } else if (arg === '--github-output') {
      args.githubOutput = true;
    }
  }

  return args;
}

function readLines(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function classifyError(message = '') {
  const lower = message.toLowerCase();

  if (
    lower.includes('locator') ||
    lower.includes('element(s) not found') ||
    lower.includes('waiting for locator')
  ) {
    return 'UI Locator Failure';
  }

  if (lower.includes('timeout') || lower.includes('waiting for response')) {
    return 'Timeout Failure';
  }

  if (lower.includes('net::err') || lower.includes('econnreset')) {
    return 'Network Failure';
  }

  if (lower.includes('expect(') || lower.includes('tocontaintext')) {
    return 'Assertion Failure';
  }

  return 'Unknown Failure';
}

function formatDuration(ms = 0) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '0s';
  }

  const seconds = ms / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function finalResult(test) {
  const results = test.results || [];
  return results[results.length - 1] || {};
}

function normalizeStatus(test) {
  const result = finalResult(test);

  if (test.status === 'skipped' || result.status === 'skipped') {
    return 'skipped';
  }

  if (
    test.status === 'unexpected' ||
    ['failed', 'timedOut', 'interrupted'].includes(result.status)
  ) {
    return 'failed';
  }

  if (result.status === 'passed' || test.status === 'expected') {
    return 'passed';
  }

  return result.status || test.status || 'unknown';
}

function testDuration(test) {
  return (test.results || []).reduce(
    (total, result) => total + (result.duration || 0),
    0
  );
}

function collectCases(suites = [], cases = []) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const result = finalResult(test);
        const rawError =
          result.error?.message ||
          result.errors?.map(error => error.message).join('\n') ||
          '';
        const error = rawError.split('\n').slice(0, 6).join('\n');
        const projectName = test.projectName || test.projectId || 'default';

        cases.push({
          name: `[${projectName}] ${spec.title}`,
          title: spec.title,
          file: spec.file,
          project: projectName,
          status: normalizeStatus(test),
          durationMs: testDuration(test),
          error,
          failureType: error ? classifyError(error) : null
        });
      }
    }

    collectCases(suite.suites || [], cases);
  }

  return cases;
}

function statusFromCases(changedTests, cases, metadata, reportExists) {
  if (changedTests.length === 0) {
    return 'skipped';
  }

  if (!reportExists || metadata.exitCode > 0) {
    return 'failed';
  }

  return cases.some(testCase => testCase.status === 'failed')
    ? 'failed'
    : 'passed';
}

function runUrl() {
  if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_RUN_ID) {
    return 'Not available outside GitHub Actions';
  }

  return `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

function summaryTitle(status) {
  if (status === 'failed') {
    return 'FAILED';
  }

  if (status === 'skipped') {
    return 'SKIPPED - no impacted tests';
  }

  return 'PASSED';
}

function renderSummary(summary) {
  const lines = [
    'AI Selective Regression Report',
    '',
    `Result: ${summaryTitle(summary.status)}`,
    `Repository: ${summary.repository}`,
    `Branch: ${summary.branch}`,
    `Commit: ${summary.commit}`,
    `Triggered by: ${summary.actor}`,
    `Generated at: ${summary.generatedAt}`,
    `GitHub Actions Run: ${summary.runUrl}`,
    '',
    'Execution Summary',
    '-----------------',
    `Changed test files: ${summary.changedTests.length}`,
    `Executed test cases: ${summary.executedTests.length}`,
    `Passed test cases: ${summary.passedTests.length}`,
    `Failed test cases: ${summary.failedTests.length}`,
    `Skipped test cases: ${summary.skippedTests.length}`,
    `Execution duration: ${summary.duration}`,
    ''
  ];

  lines.push('Executed Test Files');
  lines.push('-------------------');
  if (summary.changedTests.length === 0) {
    lines.push('No changed or newly added Playwright test files detected.');
  } else {
    summary.changedTests.forEach(test => lines.push(`- ${test}`));
  }
  lines.push('');

  lines.push('Passed Tests');
  lines.push('------------');
  if (summary.passedTests.length === 0) {
    lines.push('None');
  } else {
    summary.passedTests.forEach(test => lines.push(`- ${test.name}`));
  }
  lines.push('');

  lines.push('Failed Tests');
  lines.push('------------');
  if (summary.failedTests.length === 0) {
    lines.push('None');
  } else {
    summary.failedTests.forEach(test => {
      lines.push(`- ${test.name}`);
      lines.push(`  File: ${test.file}`);
      lines.push(`  Failure type: ${test.failureType}`);
      if (test.error) {
        lines.push(`  Error: ${test.error.replace(/\n/g, '\n  ')}`);
      }
    });
  }
  lines.push('');

  if (summary.diagnostics.length > 0) {
    lines.push('Diagnostics');
    lines.push('-----------');
    summary.diagnostics.forEach(diagnostic => lines.push(`- ${diagnostic}`));
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function writeGitHubOutput(summary) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const failedNames = summary.failedTests.map(test => test.name).join('\n');
  const output = [
    `regression_status=${summary.status}`,
    `executed_count=${summary.executedTests.length}`,
    `passed_count=${summary.passedTests.length}`,
    `failed_count=${summary.failedTests.length}`,
    `duration=${summary.duration}`,
    `email_subject=${summary.emailSubject}`,
    'failed_tests<<EOF',
    failedNames,
    'EOF'
  ].join('\n');

  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
}

function appendStepSummary(text) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\`\`\`\n${text}\`\`\`\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const changedTests = readLines(args.testsFile);
  const metadata = readJson(args.metadataFile, {
    status: changedTests.length === 0 ? 'skipped' : 'missing',
    tests: changedTests,
    durationMs: 0,
    exitCode: changedTests.length === 0 ? 0 : 1
  });
  const reportExists = fs.existsSync(args.reportFile);
  const report = readJson(args.reportFile, { suites: [], stats: {} });
  const testCases = collectCases(report.suites || []);
  const failedTests = testCases.filter(testCase => testCase.status === 'failed');
  const passedTests = testCases.filter(testCase => testCase.status === 'passed');
  const skippedTests = testCases.filter(testCase => testCase.status === 'skipped');
  const durationMs = metadata.durationMs || report.stats?.duration || 0;
  const status = statusFromCases(changedTests, testCases, metadata, reportExists);
  const diagnostics = [];

  if (changedTests.length > 0 && !reportExists) {
    diagnostics.push(`Playwright JSON report not found at ${args.reportFile}.`);
  }

  if (metadata.exitCode > 0 && failedTests.length === 0) {
    diagnostics.push(
      `Playwright exited with code ${metadata.exitCode} before failed tests were reported.`
    );
  }

  const summary = {
    status,
    repository: process.env.GITHUB_REPOSITORY || 'local',
    branch: process.env.GITHUB_REF_NAME || 'local',
    commit: process.env.GITHUB_SHA || 'local',
    actor: process.env.GITHUB_ACTOR || 'local',
    generatedAt: new Date().toISOString(),
    runUrl: runUrl(),
    changedTests,
    executedTests: testCases.filter(testCase => testCase.status !== 'skipped'),
    passedTests,
    failedTests,
    skippedTests,
    duration: formatDuration(durationMs),
    durationMs,
    diagnostics,
    emailSubject: `AI Selective Regression ${summaryTitle(status)}`
  };
  const textSummary = renderSummary(summary);

  fs.writeFileSync(args.summaryFile, textSummary);
  fs.mkdirSync(path.dirname(args.jsonSummaryFile), { recursive: true });
  fs.writeFileSync(args.jsonSummaryFile, `${JSON.stringify(summary, null, 2)}\n`);
  writeGitHubOutput(summary);
  appendStepSummary(textSummary);
  console.log(textSummary);
}

main();