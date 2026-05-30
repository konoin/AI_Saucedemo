const fs = require('fs');
const { execFileSync } = require('child_process');

const changedTestsPath = 'changed-tests.txt';
const changedTestsJsonPath = 'changed-tests.json';
const testFilePattern = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getDiffRange(args) {
  if (args.length >= 2) {
    return `${args[0]}...${args[1]}`;
  }

  if (args.length === 1) {
    return args[0];
  }

  if (process.env.GITHUB_BASE_REF) {
    return `origin/${process.env.GITHUB_BASE_REF}...HEAD`;
  }

  return 'HEAD~1..HEAD';
}

function parseChangedTests(diffOutput) {
  const changedTests = {
    added: [],
    modified: [],
  };

  for (const line of diffOutput.split('\n')) {
    if (!line.trim()) {
      continue;
    }

    const [status, ...paths] = line.split('\t');
    const filePath = status.startsWith('R') ? paths[1] : paths[0];

    if (!filePath || status.startsWith('D') || !testFilePattern.test(filePath)) {
      continue;
    }

    const bucket = status === 'A' ? changedTests.added : changedTests.modified;

    if (!bucket.includes(filePath)) {
      bucket.push(filePath);
    }
  }

  changedTests.added.sort();
  changedTests.modified.sort();

  return changedTests;
}

try {
  const diffRange = getDiffRange(process.argv.slice(2));
  const diffOutput = execFileSync('git', ['diff', '--name-status', diffRange], {
    encoding: 'utf-8',
  });
  const changedTests = parseChangedTests(diffOutput);
  const allChangedTests = [...changedTests.added, ...changedTests.modified];

  fs.writeFileSync(changedTestsPath, `${allChangedTests.join('\n')}${allChangedTests.length ? '\n' : ''}`);
  fs.writeFileSync(
    changedTestsJsonPath,
    `${JSON.stringify(
      {
        diff: diffRange,
        added: changedTests.added,
        modified: changedTests.modified,
        all: allChangedTests,
      },
      null,
      2
    )}\n`
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