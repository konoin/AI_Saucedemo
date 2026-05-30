const fs = require('fs');
const { execFileSync } = require('child_process');

const TEST_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function parseDiffArgs(args) {
  const options = {};
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--base') {
      options.base = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--head') {
      options.head = args[index + 1];
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  if (positional.length === 1) {
    return { diffArgs: [positional[0]], base: positional[0], head: '' };
  }

  if (positional.length >= 2) {
    return { diffArgs: [positional[0], positional[1]], base: positional[0], head: positional[1] };
  }

  if (options.base && options.head) {
    return { diffArgs: [options.base, options.head], base: options.base, head: options.head };
  }

  return { diffArgs: ['HEAD~1', 'HEAD'], base: 'HEAD~1', head: 'HEAD' };
}

function isActivePlaywrightSpec(filePath) {
  return TEST_PATTERN.test(filePath);
}

function parseNameStatusLine(line) {
  const parts = line.split('\t').filter(Boolean);
  const status = parts[0] || '';

  return {
    status,
    filePath: status.startsWith('R') || status.startsWith('C') ? parts[2] : parts[1],
  };
}

function classifyChange(change, result) {
  if (!change.filePath || !isActivePlaywrightSpec(change.filePath)) {
    return;
  }

  const status = change.status[0];

  if (status === 'A' || status === 'C') {
    result.added.push(change.filePath);
    return;
  }

  if (['M', 'R', 'T'].includes(status)) {
    result.modified.push(change.filePath);
  }
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

try {
  const { diffArgs, base, head } = parseDiffArgs(process.argv.slice(2));
  const diffOutput = execFileSync('git', ['diff', '--name-status', ...diffArgs], {
    encoding: 'utf-8',
  });

  const changedTests = {
    generatedAt: new Date().toISOString(),
    base,
    head,
    added: [],
    modified: [],
    all: [],
  };

  diffOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseNameStatusLine)
    .forEach((change) => classifyChange(change, changedTests));

  changedTests.added = uniqueSorted(changedTests.added);
  changedTests.modified = uniqueSorted(changedTests.modified);
  changedTests.all = uniqueSorted([...changedTests.added, ...changedTests.modified]);

  fs.writeFileSync('changed-tests.txt', changedTests.all.join('\n'), 'utf-8');
  fs.writeFileSync('changed-tests.json', `${JSON.stringify(changedTests, null, 2)}\n`, 'utf-8');

  if (changedTests.added.length > 0) {
    console.log('Added Playwright tests:');
    changedTests.added.forEach((test) => console.log(`- ${test}`));
  }

  if (changedTests.modified.length > 0) {
    console.log('Modified Playwright tests:');
    changedTests.modified.forEach((test) => console.log(`- ${test}`));
  }

  if (changedTests.all.length === 0) {
    console.log('No added or modified Playwright tests detected in framework/tests.');
  }
} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}