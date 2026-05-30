const fs = require('fs');
const { execFileSync } = require('child_process');

const SPEC_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const TXT_OUTPUT_PATH = 'changed-tests.txt';
const JSON_OUTPUT_PATH = 'changed-tests.json';

function getDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length > 0) {
    return args;
  }

  if (process.env.GITHUB_BASE_REF) {
    return [`origin/${process.env.GITHUB_BASE_REF}...HEAD`];
  }

  if (process.env.GITHUB_EVENT_BEFORE && process.env.GITHUB_SHA) {
    return [process.env.GITHUB_EVENT_BEFORE, process.env.GITHUB_SHA];
  }

  return ['HEAD~1', 'HEAD'];
}

function parseChangedTests(diffOutput) {
  const changedTests = {
    added: [],
    modified: [],
  };

  diffOutput
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const [status, file] = line.split(/\s+/);

      if (!['A', 'M'].includes(status) || !SPEC_PATTERN.test(file)) {
        return;
      }

      const target = status === 'A' ? changedTests.added : changedTests.modified;
      target.push(file);
    });

  return changedTests;
}

function writeOutputs(changedTests) {
  const allChangedTests = [...changedTests.added, ...changedTests.modified];

  fs.writeFileSync(TXT_OUTPUT_PATH, allChangedTests.join('\n'));
  fs.writeFileSync(
    JSON_OUTPUT_PATH,
    `${JSON.stringify(
      {
        added: changedTests.added,
        modified: changedTests.modified,
        all: allChangedTests,
      },
      null,
      2,
    )}\n`,
  );
}

try {
  const diffOutput = execFileSync('git', ['diff', '--name-status', ...getDiffArgs()], {
    encoding: 'utf-8',
  });
  const changedTests = parseChangedTests(diffOutput);

  writeOutputs(changedTests);

  if (changedTests.added.length > 0) {
    console.log('Added tests:');
    changedTests.added.forEach(test => console.log(`- ${test}`));
  }

  if (changedTests.modified.length > 0) {
    console.log('Modified tests:');
    changedTests.modified.forEach(test => console.log(`- ${test}`));
  }

  if (changedTests.added.length === 0 && changedTests.modified.length === 0) {
    console.log('No added or modified Playwright tests detected.');
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}