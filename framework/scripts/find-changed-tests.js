const fs = require('fs');
const { execFileSync } = require('child_process');

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const CHANGED_TESTS_FILE = 'changed-tests.txt';
const CHANGED_TESTS_JSON = 'changed-tests.json';

function getDiffArgs(args) {
  if (args.length === 0) {
    return ['HEAD~1', 'HEAD'];
  }

  if (args.length === 1) {
    return [args[0]];
  }

  return [args[0], args[1]];
}

function parseDiffLine(line) {
  const parts = line.split('\t');
  const status = parts[0];
  const file = status.startsWith('R') ? parts[2] : parts[1];

  if (!file || !TEST_FILE_PATTERN.test(file)) {
    return null;
  }

  if (status === 'A') {
    return { category: 'added', file };
  }

  if (status === 'M' || status.startsWith('R')) {
    return { category: 'modified', file };
  }

  return null;
}

function uniqueSorted(files) {
  return [...new Set(files)].sort();
}

try {
  const diffArgs = [
    'diff',
    '--name-status',
    '--diff-filter=AMR',
    ...getDiffArgs(process.argv.slice(2)),
  ];

  const diffOutput = execFileSync('git', diffArgs, { encoding: 'utf-8' });
  const changedTests = {
    added: [],
    modified: [],
  };

  diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDiffLine)
    .filter(Boolean)
    .forEach(({ category, file }) => {
      changedTests[category].push(file);
    });

  changedTests.added = uniqueSorted(changedTests.added);
  changedTests.modified = uniqueSorted(changedTests.modified);

  const allChangedTests = uniqueSorted([
    ...changedTests.added,
    ...changedTests.modified,
  ]);

  fs.writeFileSync(CHANGED_TESTS_FILE, `${allChangedTests.join('\n')}${allChangedTests.length ? '\n' : ''}`);
  fs.writeFileSync(
    CHANGED_TESTS_JSON,
    `${JSON.stringify(changedTests, null, 2)}\n`,
  );

  if (allChangedTests.length === 0) {
    console.log('No added or modified Playwright tests detected.');
  } else {
    console.log('Added tests:');
    changedTests.added.forEach((test) => console.log(`- ${test}`));
    console.log('Modified tests:');
    changedTests.modified.forEach((test) => console.log(`- ${test}`));
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);
  process.exit(1);
}