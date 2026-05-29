const fs = require('fs');
const path = require('path');

const DEFAULT_RESULTS_DIR = 'regression-results';

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listItems(items, getLabel) {
  if (!items || items.length === 0) {
    return '- None';
  }

  return items.map(item => `- ${getLabel(item)}`).join('\n');
}

function testLabel(test) {
  const location = test.file && test.line ? ` (${test.file}:${test.line})` : '';
  return `${test.name}${location}`;
}

function fileLabel(filePath) {
  return filePath;
}

function getRunUrl() {
  if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
    return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  }

  return process.env.GITHUB_RUN_URL || 'Unavailable outside GitHub Actions';
}

function createSummary(summary) {
  const runUrl = getRunUrl();
  const failedNames = summary.failedTests.map(test => test.name).join(', ') || 'None';

  return `# AI Playwright Regression Summary

Status: ${summary.status}
Duration: ${summary.duration}
Requested test files: ${summary.requestedTestFiles.length}
Executed tests: ${summary.executedTests.length}
Passed tests: ${summary.passedTests.length}
Failed tests: ${summary.failedTests.length}
Failed test names: ${failedNames}
Run URL: ${runUrl}

## Executed test files
${listItems(summary.requestedTestFiles, fileLabel)}

## Passed tests
${listItems(summary.passedTests, testLabel)}

## Failed tests
${listItems(summary.failedTests, testLabel)}
`;
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

function main() {
  const args = parseArgs(process.argv.slice(2));
  const resultsDir = args['results-dir'] || DEFAULT_RESULTS_DIR;
  const summaryPath = path.join(resultsDir, 'summary.json');
  const markdownPath = path.join(resultsDir, 'summary.md');
  const emailBodyPath = path.join(resultsDir, 'email-body.txt');
  const summary = readJson(summaryPath);
  const formattedSummary = createSummary(summary);

  fs.writeFileSync(markdownPath, formattedSummary);
  fs.writeFileSync(emailBodyPath, formattedSummary);
  writeGithubOutput(process.env.GITHUB_OUTPUT, {
    email_body: formattedSummary,
    email_subject_status: summary.status,
    failed_test_count: String(summary.failedTests.length),
  });

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, formattedSummary);
  }

  console.log(`Wrote regression summary to ${markdownPath}`);
}

main();
