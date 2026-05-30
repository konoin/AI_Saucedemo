const fs = require('fs');
const { execFileSync } = require('child_process');

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function buildDiffArgs(args) {
  const paths = ['framework/tests'];

  if (args.length >= 2) {
    return ['diff', '--name-status', '--diff-filter=AM', args[0], args[1], '--', ...paths];
  }

  if (args.length === 1) {
    return ['diff', '--name-status', '--diff-filter=AM', args[0], '--', ...paths];
  }

  return ['diff', '--name-status', '--diff-filter=AM', 'HEAD~1', 'HEAD', '--', ...paths];
}

function parseChangedTests(output) {
  const changed = {
    added: [],
    modified: [],
  };

  output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [status, file] = line.split(/\s+/);

      if (!file || !TEST_FILE_PATTERN.test(file)) {
        return;
      }

      if (status === 'A') {
        changed.added.push(file);
      }

      if (status === 'M') {
        changed.modified.push(file);
      }
    });

  return {
    ...changed,
    all: [...changed.added, ...changed.modified],
  };
}

try {
  const diffArgs = buildDiffArgs(process.argv.slice(2));
  const output = execFileSync('git', diffArgs, { encoding: 'utf-8' });
  const changedTests = parseChangedTests(output);

  fs.writeFileSync('changed-tests.txt', `${changedTests.all.join('\n')}${changedTests.all.length ? '\n' : ''}`);
  fs.writeFileSync('changed-tests.json', JSON.stringify(changedTests, null, 2));

  if (changedTests.all.length === 0) {
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