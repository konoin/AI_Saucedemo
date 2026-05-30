const fs = require('fs');
const { execFileSync } = require('child_process');

const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_TEXT = 'changed-tests.txt';
const TEST_FILE_PATTERN = /^framework\/tests\/.+\.(spec|test)\.ts$/;

function getDiffRange() {
  const cliRange = process.argv.slice(2).filter(Boolean);

  if (cliRange.length > 0) {
    return cliRange;
  }

  if (process.env.GITHUB_BASE_REF) {
    return [`origin/${process.env.GITHUB_BASE_REF}...HEAD`];
  }

  if (process.env.GITHUB_EVENT_BEFORE && process.env.GITHUB_SHA) {
    return [`${process.env.GITHUB_EVENT_BEFORE}...${process.env.GITHUB_SHA}`];
  }

  return ['HEAD~1', 'HEAD'];
}

function isActivePlaywrightTest(filePath) {
  return TEST_FILE_PATTERN.test(filePath) && !filePath.endsWith('.example.ts');
}

function addUnique(target, value) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function parseChangedTests(diffOutput) {
  const changedTests = {
    added: [],
    modified: [],
  };

  diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [status, firstPath, secondPath] = line.split('\t');
      const statusCode = status.charAt(0);
      const filePath = statusCode === 'R' || statusCode === 'C' ? secondPath : firstPath;

      if (!filePath || !isActivePlaywrightTest(filePath)) {
        return;
      }

      if (statusCode === 'A' || statusCode === 'C') {
        addUnique(changedTests.added, filePath);
        return;
      }

      if (statusCode === 'M' || statusCode === 'R') {
        addUnique(changedTests.modified, filePath);
      }
    });

  changedTests.added.sort();
  changedTests.modified.sort();

  return changedTests;
}

try {
  const diffRange = getDiffRange();
  const diffOutput = execFileSync(
    'git',
    ['diff', '--name-status', ...diffRange, '--', 'framework/tests'],
    { encoding: 'utf-8' },
  );
  const changedTests = parseChangedTests(diffOutput);
  const allChangedTests = [...changedTests.added, ...changedTests.modified];

  fs.writeFileSync(
    CHANGED_TESTS_JSON,
    JSON.stringify({ ...changedTests, all: allChangedTests }, null, 2),
    'utf-8',
  );
  fs.writeFileSync(
    CHANGED_TESTS_TEXT,
    allChangedTests.length > 0 ? `${allChangedTests.join('\n')}\n` : '',
    'utf-8',
  );

  if (allChangedTests.length === 0) {
    console.log('No added or modified Playwright tests detected.');
  } else {
    console.log('Detected added Playwright tests:');
    changedTests.added.forEach((test) => console.log(`- ${test}`));
    console.log('Detected modified Playwright tests:');
    changedTests.modified.forEach((test) => console.log(`- ${test}`));
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);
  process.exit(1);
}