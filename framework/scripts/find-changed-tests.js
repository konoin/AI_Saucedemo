const { execSync } = require('child_process');
const fs = require('fs');

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const STATUS_MAP = {
  A: 'added',
  M: 'modified',
};

function detectDiff(range) {
  return execSync(`git diff --name-status --diff-filter=AM ${range}`, {
    encoding: 'utf-8',
  });
}

function resolveDiffOutput() {
  const requestedRange =
    process.env.CHANGED_TESTS_DIFF || process.argv.slice(2).join(' ');
  const ranges = requestedRange ? [requestedRange] : ['origin/main...HEAD'];

  if (!requestedRange) {
    ranges.push('HEAD~1 HEAD');
  }

  let lastError;

  for (const range of ranges) {
    try {
      return {
        range,
        output: detectDiff(range),
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function parseChangedTests(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, file] = line.split(/\s+/);

      return {
        status: STATUS_MAP[status],
        path: file,
      };
    })
    .filter((entry) => entry.status && TEST_FILE_PATTERN.test(entry.path));
}

try {
  const { range, output } = resolveDiffOutput();
  const tests = parseChangedTests(output);
  const metadata = {
    generatedAt: new Date().toISOString(),
    diffRange: range,
    added: tests
      .filter((test) => test.status === 'added')
      .map((test) => test.path),
    modified: tests
      .filter((test) => test.status === 'modified')
      .map((test) => test.path),
    tests,
  };
  const testList = tests.map((test) => test.path).join('\n');

  fs.writeFileSync('changed-tests.txt', testList ? `${testList}\n` : '');
  fs.writeFileSync('changed-tests.json', JSON.stringify(metadata, null, 2));

  if (testList) {
    console.log(testList);
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}