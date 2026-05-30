const fs = require('fs');
const { execFileSync } = require('child_process');

const CHANGED_TESTS_TXT = 'changed-tests.txt';
const CHANGED_TESTS_JSON = 'changed-tests.json';
const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length > 0) {
    return args;
  }

  return ['HEAD~1', 'HEAD'];
}

function parseChangedTests(output) {
  const changed = {
    added: [],
    modified: [],
  };

  for (const line of output.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const [status, ...pathParts] = trimmed.split(/\s+/);
    const filePath = pathParts[pathParts.length - 1];

    if (!TEST_FILE_PATTERN.test(filePath)) {
      continue;
    }

    if (status === 'A') {
      changed.added.push(filePath);
    } else if (status === 'M') {
      changed.modified.push(filePath);
    }
  }

  return {
    added: changed.added.sort(),
    modified: changed.modified.sort(),
  };
}

try {
  const diffArgs = [
    'diff',
    '--name-status',
    '--diff-filter=AM',
    ...getDiffArgs(),
    '--',
    'framework/tests',
  ];
  const output = execFileSync('git', diffArgs, { encoding: 'utf-8' });
  const changedTests = parseChangedTests(output);
  const all = [...changedTests.added, ...changedTests.modified];
  const payload = {
    ...changedTests,
    all,
  };

  fs.writeFileSync(CHANGED_TESTS_TXT, all.join('\n') + (all.length > 0 ? '\n' : ''));
  fs.writeFileSync(CHANGED_TESTS_JSON, JSON.stringify(payload, null, 2) + '\n');

  all.forEach(test => console.log(test));
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}