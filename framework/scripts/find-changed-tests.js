const fs = require('fs');
const { execFileSync } = require('child_process');

const CHANGED_TESTS_JSON = 'changed-tests.json';
const CHANGED_TESTS_TXT = 'changed-tests.txt';
const PLAYWRIGHT_TEST_PATTERN = /^framework\/tests\/.+\.(spec|test)\.ts$/;

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function isPlaywrightTest(filePath) {
  return PLAYWRIGHT_TEST_PATTERN.test(normalizePath(filePath));
}

function runGitDiff(diffRangeArgs) {
  const args = ['diff', '--name-status', '--diff-filter=AM'];

  if (diffRangeArgs.length > 0) {
    args.push(...diffRangeArgs);
  } else {
    args.push('HEAD~1', 'HEAD');
  }

  return execFileSync('git', args, { encoding: 'utf-8' });
}

function uniqueSorted(files) {
  return [...new Set(files)].sort();
}

function writeGithubOutput(allTests, addedTests, modifiedTests) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const output = [
    `changed_count=${allTests.length}`,
    `added_count=${addedTests.length}`,
    `modified_count=${modifiedTests.length}`,
    'tests<<EOF',
    ...allTests,
    'EOF',
  ].join('\n');

  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`, 'utf-8');
}

try {
  const diffRangeArgs = process.argv.slice(2).filter(Boolean);
  const diffOutput = runGitDiff(diffRangeArgs);
  const addedTests = [];
  const modifiedTests = [];

  for (const line of diffOutput.split('\n')) {
    if (!line.trim()) {
      continue;
    }

    const [status, filePath] = line.split(/\t+/);
    const normalizedFile = normalizePath(filePath || '');

    if (!isPlaywrightTest(normalizedFile)) {
      continue;
    }

    if (status === 'A') {
      addedTests.push(normalizedFile);
    }

    if (status === 'M') {
      modifiedTests.push(normalizedFile);
    }
  }

  const added = uniqueSorted(addedTests);
  const modified = uniqueSorted(modifiedTests);
  const all = uniqueSorted([...added, ...modified]);

  fs.writeFileSync(CHANGED_TESTS_TXT, all.length ? `${all.join('\n')}\n` : '', 'utf-8');
  fs.writeFileSync(
    CHANGED_TESTS_JSON,
    JSON.stringify(
      {
        added,
        modified,
        all,
        diffRange: diffRangeArgs.join(' ') || 'HEAD~1 HEAD',
      },
      null,
      2,
    ),
    'utf-8',
  );

  writeGithubOutput(all, added, modified);

  console.log(`Added tests: ${added.length}`);
  added.forEach((test) => console.log(`- ${test}`));
  console.log(`Modified tests: ${modified.length}`);
  modified.forEach((test) => console.log(`- ${test}`));
} catch (error) {
  console.error('Failed to detect changed Playwright tests.');
  console.error(error.message);

  process.exit(1);
}