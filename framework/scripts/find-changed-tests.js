const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_PATTERNS = [
  'tests/**/*.spec.ts',
  'tests/**/*.test.ts',
  // The current Playwright config stores tests under framework/tests.
  'framework/tests/**/*.spec.ts',
  'framework/tests/**/*.test.ts',
];
const EMPTY_TREE_SHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const [key, inlineValue] = token.slice(2).split('=');
    const nextValue = argv[index + 1];

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
    } else if (nextValue && !nextValue.startsWith('--')) {
      args[key] = nextValue;
      index += 1;
    } else {
      args[key] = true;
    }
  }

  return args;
}

function normalizeSha(value) {
  if (!value || /^0+$/.test(value)) {
    return '';
  }

  return value;
}

function runGit(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function resolveBaseSha(explicitBase) {
  const base = normalizeSha(explicitBase || process.env.GITHUB_EVENT_BEFORE);

  if (base) {
    return base;
  }

  try {
    return runGit(['rev-parse', 'HEAD~1']);
  } catch (error) {
    return EMPTY_TREE_SHA;
  }
}

function resolveHeadSha(explicitHead) {
  return normalizeSha(explicitHead || process.env.GITHUB_SHA) || 'HEAD';
}

function parsePatterns(value) {
  if (!value) {
    return DEFAULT_PATTERNS;
  }

  return value
    .split(',')
    .map(pattern => pattern.trim())
    .filter(Boolean);
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(pattern) {
  const normalizedPattern = pattern.replace(/\\/g, '/');
  let regex = '^';

  for (let index = 0; index < normalizedPattern.length; index += 1) {
    const char = normalizedPattern[index];
    const next = normalizedPattern[index + 1];

    if (char === '*' && next === '*') {
      const following = normalizedPattern[index + 2];

      if (following === '/') {
        regex += '(?:.*/)?';
        index += 2;
      } else {
        regex += '.*';
        index += 1;
      }
    } else if (char === '*') {
      regex += '[^/]*';
    } else {
      regex += escapeRegex(char);
    }
  }

  regex += '$';
  return new RegExp(regex);
}

function parseChangedFiles(diffOutput) {
  return diffOutput
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const columns = line.split('\t');
      const status = columns[0];
      const filePath = columns[columns.length - 1];

      return {
        status,
        filePath,
      };
    })
    .filter(change => ['A', 'M'].includes(change.status))
    .map(change => change.filePath.replace(/\\/g, '/'));
}

function getChangedTests({ baseSha, headSha, patterns }) {
  const diffOutput = runGit([
    'diff',
    '--name-status',
    '--diff-filter=AM',
    baseSha,
    headSha,
  ]);
  const matchers = patterns.map(globToRegex);

  return [...new Set(parseChangedFiles(diffOutput))]
    .filter(filePath => matchers.some(matcher => matcher.test(filePath)))
    .filter(filePath => fs.existsSync(path.resolve(filePath)))
    .sort((left, right) => left.localeCompare(right));
}

function writeGithubOutput(outputPath, values) {
  if (!outputPath) {
    return;
  }

  const lines = Object.entries(values).flatMap(([key, value]) => {
    if (String(value).includes('\n')) {
      return [`${key}<<EOF`, String(value), 'EOF'];
    }

    return [`${key}=${value}`];
  });

  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`);
}

function writeListFile(filePath, tests) {
  if (!filePath) {
    return;
  }

  const directory = path.dirname(filePath);

  if (directory !== '.') {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, tests.length ? `${tests.join('\n')}\n` : '');
}

function writeJsonFile(filePath, payload) {
  if (!filePath) {
    return;
  }

  const directory = path.dirname(filePath);

  if (directory !== '.') {
    fs.mkdirSync(directory, { recursive: true });
  }

  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const patterns = parsePatterns(args.patterns || process.env.TEST_FILE_GLOBS);
  const baseSha = resolveBaseSha(args.base);
  const headSha = resolveHeadSha(args.head);
  const tests = getChangedTests({ baseSha, headSha, patterns });
  const listFile = args['list-file'] || 'changed-tests.txt';
  const jsonFile = args['json-file'] || 'changed-tests.json';

  writeListFile(listFile, tests);
  writeJsonFile(jsonFile, {
    baseSha,
    headSha,
    patterns,
    tests,
    count: tests.length,
  });
  writeGithubOutput(process.env.GITHUB_OUTPUT, {
    has_changed_tests: tests.length > 0 ? 'true' : 'false',
    test_count: String(tests.length),
    test_list: tests.join('\n'),
  });

  console.log(`Compared ${baseSha}...${headSha}`);
  console.log(`Detected ${tests.length} changed Playwright test file(s).`);

  for (const testFile of tests) {
    console.log(`- ${testFile}`);
  }
}

try {
  main();
} catch (error) {
  console.error('Failed to detect changed Playwright tests.');
  console.error(error.message);
  process.exit(1);
}