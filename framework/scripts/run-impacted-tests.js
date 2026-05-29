const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseArgs(argv) {
  const args = {
    testsFile: process.env.CHANGED_TESTS_FILE || 'changed-tests.txt',
    metadataFile:
      process.env.IMPACTED_RUN_METADATA || 'playwright-report/impacted-run.json',
    workers: process.env.PLAYWRIGHT_WORKERS || '2',
    projects: (process.env.PLAYWRIGHT_PROJECTS || '')
      .split(',')
      .map(project => project.trim())
      .filter(Boolean)
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--tests-file') {
      args.testsFile = argv[index + 1];
      index += 1;
    } else if (arg === '--metadata-file') {
      args.metadataFile = argv[index + 1];
      index += 1;
    } else if (arg === '--workers') {
      args.workers = argv[index + 1];
      index += 1;
    } else if (arg === '--projects') {
      args.projects = argv[index + 1]
        .split(',')
        .map(project => project.trim())
        .filter(Boolean);
      index += 1;
    }
  }

  return args;
}

function readTests(testsFile) {
  if (!fs.existsSync(testsFile)) {
    return [];
  }

  return fs
    .readFileSync(testsFile, 'utf8')
    .split(/\r?\n/)
    .map(test => test.trim())
    .filter(Boolean);
}

function writeMetadata(metadataFile, metadata) {
  fs.mkdirSync(path.dirname(metadataFile), { recursive: true });
  fs.writeFileSync(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tests = readTests(args.testsFile);
  const startedAt = new Date();

  if (tests.length === 0) {
    writeMetadata(args.metadataFile, {
      status: 'skipped',
      tests,
      startedAt: startedAt.toISOString(),
      endedAt: new Date().toISOString(),
      durationMs: 0,
      exitCode: 0,
      command: null
    });
    console.log('No changed Playwright tests detected. Skipping execution.');
    return;
  }

  const playwrightArgs = [
    'playwright',
    'test',
    ...tests,
    '--retries=0',
    `--workers=${args.workers}`
  ];

  for (const project of args.projects) {
    playwrightArgs.push(`--project=${project}`);
  }

  const command = ['npx', ...playwrightArgs].join(' ');
  console.log(`Executing ${tests.length} impacted Playwright test file(s).`);
  console.log(`Command: ${command}`);

  const result = spawnSync('npx', playwrightArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  const endedAt = new Date();
  const exitCode = typeof result.status === 'number' ? result.status : 1;

  writeMetadata(args.metadataFile, {
    status: exitCode === 0 ? 'completed' : 'failed',
    tests,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    exitCode,
    command
  });

  if (result.error) {
    console.error(result.error.message);
  }

  process.exit(exitCode);
}

main();
