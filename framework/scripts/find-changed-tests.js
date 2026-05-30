const fs = require('fs');
const { execFileSync } = require('child_process');

const SPEC_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const TEXT_OUTPUT_PATH = 'changed-tests.txt';
const JSON_OUTPUT_PATH = 'changed-tests.json';

function getDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length === 0) {
    return ['HEAD~1', 'HEAD'];
  }

  if (args.length === 1) {
    return [args[0]];
  }

  return [args[0], args[1]];
}

function parseNameStatusLine(line) {
  const parts = line.split('\t').filter(Boolean);
  const status = parts[0];

  return {
    status,
    file: status.startsWith('R') || status.startsWith('C') ? parts[2] : parts[1],
  };
}

function classifyChangedTests(diffOutput) {
  const changes = {
    added: [],
    modified: [],
  };

  diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseNameStatusLine)
    .filter(({ file }) => SPEC_PATTERN.test(file))
    .forEach(({ status, file }) => {
      if (status === 'A') {
        changes.added.push(file);
      }

      if (status === 'M') {
        changes.modified.push(file);
      }
    });

  return {
    ...changes,
    all: [...changes.added, ...changes.modified],
  };
}

try {
  const diffOutput = execFileSync('git', ['diff', '--name-status', ...getDiffArgs()], {
    encoding: 'utf-8',
  });
  const changedTests = classifyChangedTests(diffOutput);

  fs.writeFileSync(TEXT_OUTPUT_PATH, `${changedTests.all.join('\n')}${changedTests.all.length ? '\n' : ''}`);
  fs.writeFileSync(JSON_OUTPUT_PATH, `${JSON.stringify(changedTests, null, 2)}\n`);

  changedTests.all.forEach((test) => console.log(test));
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}