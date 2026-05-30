const { execFileSync } = require('child_process');
const fs = require('fs');

const CHANGED_TESTS_PATH = 'changed-tests.txt';
const CHANGED_TESTS_JSON_PATH = 'changed-tests.json';
const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function defaultDiffArgs() {
  if (process.env.GITHUB_EVENT_BEFORE && process.env.GITHUB_SHA) {
    return [process.env.GITHUB_EVENT_BEFORE, process.env.GITHUB_SHA];
  }

  if (process.env.GITHUB_BASE_REF) {
    return [`origin/${process.env.GITHUB_BASE_REF}...HEAD`];
  }

  return ['HEAD~1', 'HEAD'];
}

function parseDiffLine(line) {
  const [status, firstPath, secondPath] = line.split('\t');
  const filePath = status.startsWith('R') || status.startsWith('C')
    ? secondPath
    : firstPath;

  return {
    status,
    filePath,
  };
}

function sortUnique(files) {
  return [...new Set(files)].sort();
}

try {
  const diffArgs = process.argv.slice(2);
  const args = [
    'diff',
    '--name-status',
    '--diff-filter=AMR',
    ...(diffArgs.length > 0 ? diffArgs : defaultDiffArgs()),
    '--',
    'framework/tests',
  ];

  const changedFiles = execFileSync('git', args, { encoding: 'utf-8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDiffLine)
    .filter(({ filePath }) => TEST_FILE_PATTERN.test(filePath));

  const added = sortUnique(
    changedFiles
      .filter(({ status }) => status === 'A')
      .map(({ filePath }) => filePath),
  );
  const modified = sortUnique(
    changedFiles
      .filter(({ status }) => status === 'M' || status.startsWith('R'))
      .map(({ filePath }) => filePath),
  );
  const all = sortUnique([...added, ...modified]);

  fs.writeFileSync(CHANGED_TESTS_PATH, all.join('\n') + (all.length ? '\n' : ''), 'utf-8');
  fs.writeFileSync(
    CHANGED_TESTS_JSON_PATH,
    JSON.stringify({ added, modified, all }, null, 2),
    'utf-8',
  );

  if (all.length === 0) {
    console.log('No added or modified Playwright tests detected.');
  } else {
    console.log('Added tests:');
    console.log(added.length ? added.map((file) => `- ${file}`).join('\n') : 'None');
    console.log('\nModified tests:');
    console.log(modified.length ? modified.map((file) => `- ${file}`).join('\n') : 'None');
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}