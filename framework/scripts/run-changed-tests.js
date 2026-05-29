const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_LIST_FILE = 'changed-tests.txt';
const DEFAULT_RESULTS_DIR = 'regression-results';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const [key, inlineValue] = token.slice(2).split('=');
    const nextValue = argv[index + 1];

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
    } else if (nextValue && !nextValue.startsWith('--')) {
      args[key] = nextValue;
      index += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function readTestList(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function getSuitePath(suite, ancestors = []) {
  const title = suite.title ? [...ancestors, suite.title] : ancestors;
  return title.filter(Boolean);
}

function getFinalResult(testCase) {
  if (!Array.isArray(testCase.results) || testCase.results.length === 0) {
    return {};
  }

  return testCase.results[testCase.results.length - 1] || {};
}

function getTestOutcome(testCase) {
  const finalResult = getFinalResult(testCase);

  if (testCase.status === 'unexpected') {
    return 'failed';
  }

  if (testCase.status === 'flaky') {
    return 'failed';
  }

  if (finalResult.status === 'passed') {
    return 'passed';
  }

  if (finalResult.status === 'skipped' || testCase.status === 'skipped') {
    return 'skipped';
  }

  if (['failed', 'timedOut', 'interrupted'].includes(finalResult.status)) {
    return 'failed';
  }

  return testCase.status || finalResult.status || 'unknown';
}

function summarizeSpec(spec, suitePath) {
  return (spec.tests || []).map(testCase => {
    const project = testCase.projectName ? `[${testCase.projectName}] ` : '';
    const titleParts = [...suitePath, spec.title].filter(Boolean);
    const name = `${project}${titleParts.join(' > ')}`;
    const outcome = getTestOutcome(testCase);

    return {
      name,
      file: spec.file,
      line: spec.line,
      project: testCase.projectName || '',
      status: outcome,
      durationMs: (testCase.results || []).reduce(
        (total, result) => total + (result.duration || 0),
        0
      ),
    };
  });
}

function collectTestsFromSuite(suite, ancestors = []) {
  const suitePath = getSuitePath(suite, ancestors);
  const specTests = (suite.specs || []).flatMap(spec =>
    summarizeSpec(spec, suitePath)
  );
  const nestedTests = (suite.suites || []).flatMap(childSuite =>
    collectTestsFromSuite(childSuite, suitePath)
  );

  return [...specTests, ...nestedTests];
}

function summarizePlaywrightJson(report, requestedTests, durationMs, exitCode) {
  const executedTests = (report.suites || []).flatMap(suite =>
    collectTestsFromSuite(suite)
  );
  const failedTests = executedTests.filter(test => test.status === 'failed');
  const passedTests = executedTests.filter(test => test.status === 'passed');
  const skippedTests = executedTests.filter(test => test.status === 'skipped');

  return {
    status: exitCode === 0 && failedTests.length === 0 ? 'passed' : 'failed',
    exitCode,
    durationMs,
    duration: formatDuration(durationMs),
    requestedTestFiles: requestedTests,
    executedTests,
    passedTests,
    failedTests,
    skippedTests,
  };
}

function createSkippedSummary(requestedTests) {
  return {
    status: 'passed',
    exitCode: 0,
    durationMs: 0,
    duration: '0s',
    requestedTestFiles: requestedTests,
    executedTests: [],
    passedTests: [],
    failedTests: [],
    skippedTests: [],
    note: 'No changed or newly added Playwright test files were detected.',
  };
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function runPlaywright(testFiles, resultsDir) {
  const jsonReportPath = path.join(resultsDir, 'playwright-results.json');
  const stderrPath = path.join(resultsDir, 'playwright-stderr.log');
  const workers = process.env.PLAYWRIGHT_WORKERS || '50%';
  const args = [
    'playwright',
    'test',
    ...testFiles,
    '--reporter=json',
    '--retries=0',
    `--workers=${workers}`,
  ];

  console.log(`Running ${testFiles.length} changed Playwright test file(s).`);
  console.log(`Playwright workers: ${workers}`);

  const startedAt = Date.now();
  const result = spawnSync('npx', args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  const durationMs = Date.now() - startedAt;
  const exitCode = result.status === null ? 1 : result.status;

  fs.writeFileSync(jsonReportPath, result.stdout || '');
  fs.writeFileSync(stderrPath, result.stderr || '');

  if (result.stderr) {
    console.error(result.stderr.trim());
  }

  let report = {};

  try {
    report = JSON.parse(result.stdout || '{}');
  } catch (error) {
    return {
      status: 'failed',
      exitCode: exitCode || 1,
      durationMs,
      duration: formatDuration(durationMs),
      requestedTestFiles: testFiles,
      executedTests: [],
      passedTests: [],
      failedTests: [
        {
          name: 'Unable to parse Playwright JSON report',
          status: 'failed',
          message: error.message,
        },
      ],
      skippedTests: [],
    };
  }

  return summarizePlaywrightJson(report, testFiles, durationMs, exitCode);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const listFile = args['list-file'] || DEFAULT_LIST_FILE;
  const resultsDir = args['results-dir'] || DEFAULT_RESULTS_DIR;
  const summaryPath = path.join(resultsDir, 'summary.json');
  const exitCodePath = path.join(resultsDir, 'exit-code.txt');
  const testFiles = readTestList(listFile);

  ensureDirectory(resultsDir);

  const summary = testFiles.length
    ? runPlaywright(testFiles, resultsDir)
    : createSkippedSummary(testFiles);

  writeJson(summaryPath, summary);
  fs.writeFileSync(exitCodePath, `${summary.exitCode}\n`);

  console.log(`Regression status: ${summary.status}`);
  console.log(`Duration: ${summary.duration}`);
  console.log(`Executed tests: ${summary.executedTests.length}`);
  console.log(`Passed tests: ${summary.passedTests.length}`);
  console.log(`Failed tests: ${summary.failedTests.length}`);

  process.exit(summary.exitCode);
}

main();
