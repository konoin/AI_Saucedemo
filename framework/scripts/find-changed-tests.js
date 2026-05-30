const fs = require('fs');
const { execFileSync } = require('child_process');

const changedTestsTextPath = 'changed-tests.txt';
const changedTestsJsonPath = 'changed-tests.json';
const testFilePattern = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length > 0) {
    return ['diff', '--name-status', ...args];
  }

  return ['diff', '--name-status', 'HEAD~1', 'HEAD'];
}

function isTrackedTest(filePath) {
  return testFilePattern.test(filePath);
}

function parseChangedTests(diffOutput) {
  const added = new Set();
  const modified = new Set();

  diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [status, firstPath, secondPath] = line.split('\t');
      const newPath = secondPath || firstPath;

      if (!isTrackedTest(newPath)) {
        return;
      }

      if (status === 'A') {
        added.add(newPath);
        modified.delete(newPath);
        return;
      }

      if (status === 'M' || status === 'T') {
        if (!added.has(newPath)) {
          modified.add(newPath);
        }
        return;
      }

      if (status.startsWith('R') || status.startsWith('C')) {
        if (isTrackedTest(firstPath)) {
          modified.add(newPath);
        } else {
          added.add(newPath);
        }
      }
    });

  return {
    added: [...added],
    modified: [...modified],
  };
}

try {
  const diffOutput = execFileSync('git', getDiffArgs(), { encoding: 'utf-8' });
  const changedTests = parseChangedTests(diffOutput);
  const allChangedTests = [...changedTests.added, ...changedTests.modified];

  fs.writeFileSync(changedTestsTextPath, allChangedTests.join('\n'), 'utf-8');
  fs.writeFileSync(
    changedTestsJsonPath,
    JSON.stringify(
      {
        added: changedTests.added,
        modified: changedTests.modified,
        all: allChangedTests,
      },
      null,
      2,
    ),
    'utf-8',
  );

  allChangedTests.forEach((test) => console.log(test));
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}