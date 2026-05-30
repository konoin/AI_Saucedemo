const { execFileSync } = require('child_process');
const fs = require('fs');

const CHANGED_TESTS_PATH = 'changed-tests.txt';
const CHANGED_TESTS_JSON_PATH = 'changed-tests.json';
const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getDiffArgs() {
  const providedArgs = process.argv.slice(2).filter(Boolean);

  if (providedArgs.length > 0) {
    return providedArgs;
  }

  return ['HEAD~1', 'HEAD'];
}

function normalizePath(filePath) {
  return filePath.trim().replace(/\\/g, '/');
}

function createEmptyResult() {
  return {
    added: [],
    modified: [],
    changed: [],
  };
}

function classifyChangedTests(diffOutput) {
  const result = createEmptyResult();

  for (const line of diffOutput.split('\n')) {
    if (!line.trim()) {
      continue;
    }

    const parts = line.split('\t');
    const status = parts[0];
    const filePath = normalizePath(parts[parts.length - 1] || '');

    if (!TEST_FILE_PATTERN.test(filePath)) {
      continue;
    }

    if (status === 'A') {
      result.added.push(filePath);
    } else if (status === 'M' || status.startsWith('R')) {
      result.modified.push(filePath);
    }
  }

  result.added = [...new Set(result.added)].sort();
  result.modified = [...new Set(result.modified)].sort();
  result.changed = [...new Set([...result.added, ...result.modified])].sort();

  return result;
}

try {
  const diffOutput = execFileSync(
    'git',
    ['diff', '--name-status', ...getDiffArgs()],
    { encoding: 'utf-8' }
  );
  const changedTests = classifyChangedTests(diffOutput);

  fs.writeFileSync(CHANGED_TESTS_PATH, `${changedTests.changed.join('\n')}${changedTests.changed.length ? '\n' : ''}`);
  fs.writeFileSync(CHANGED_TESTS_JSON_PATH, `${JSON.stringify(changedTests, null, 2)}\n`);

  if (changedTests.changed.length === 0) {
    console.log('No added or modified Playwright tests detected.');
  } else {
    console.log('Added tests:');
    console.log(changedTests.added.length ? changedTests.added.map(test => `- ${test}`).join('\n') : '- none');
    console.log('\nModified tests:');
    console.log(changedTests.modified.length ? changedTests.modified.map(test => `- ${test}`).join('\n') : '- none');
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}