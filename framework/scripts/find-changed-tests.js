const { execFileSync } = require('child_process');
const fs = require('fs');

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const CHANGED_TESTS_TXT = 'changed-tests.txt';
const CHANGED_TESTS_JSON = 'changed-tests.json';

function buildDiffArgs(args) {
  if (args.length === 0) {
    return ['HEAD~1', 'HEAD'];
  }

  if (args.length === 1) {
    return [args[0]];
  }

  return args.slice(0, 2);
}

function parseNameStatus(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, firstPath, secondPath] = line.split('\t');
      const normalizedStatus = status.replace(/\d+$/, '');
      const filePath = secondPath || firstPath;

      return {
        status: normalizedStatus,
        filePath,
      };
    });
}

function uniqueSorted(files) {
  return Array.from(new Set(files)).sort();
}

try {
  const diffArgs = buildDiffArgs(process.argv.slice(2));
  const output = execFileSync('git', ['diff', '--name-status', '-M', ...diffArgs], {
    encoding: 'utf-8',
  });

  const detected = parseNameStatus(output).reduce(
    (accumulator, change) => {
      if (change.status === 'D' || !TEST_FILE_PATTERN.test(change.filePath)) {
        return accumulator;
      }

      if (change.status === 'A') {
        accumulator.added.push(change.filePath);
      } else {
        accumulator.modified.push(change.filePath);
      }

      return accumulator;
    },
    { added: [], modified: [] },
  );

  const added = uniqueSorted(detected.added);
  const modified = uniqueSorted(detected.modified);
  const all = uniqueSorted([...added, ...modified]);

  fs.writeFileSync(CHANGED_TESTS_TXT, all.length ? `${all.join('\n')}\n` : '');
  fs.writeFileSync(
    CHANGED_TESTS_JSON,
    `${JSON.stringify({ added, modified, all }, null, 2)}\n`,
  );

  if (all.length === 0) {
    console.log('No added or modified Playwright tests detected.');
  } else {
    console.log('Changed Playwright tests detected:');
    added.forEach((file) => console.log(`A ${file}`));
    modified.forEach((file) => console.log(`M ${file}`));
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}