const { execSync } = require("child_process");
const fs = require("fs");

const TEXT_OUTPUT_PATH = "changed-tests.txt";
const JSON_OUTPUT_PATH = "changed-tests.json";
const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getDiffRange() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length > 0) {
    return args.join(" ");
  }

  if (process.env.GITHUB_BASE_REF) {
    return `origin/${process.env.GITHUB_BASE_REF}...HEAD`;
  }

  return "HEAD~1 HEAD";
}

function parseDiffLine(line) {
  const [status, ...paths] = line.split("\t");
  const code = status.charAt(0);
  const file = code === "R" || code === "C" ? paths[paths.length - 1] : paths[0];

  return { code, file };
}

function uniqueSorted(items) {
  return Array.from(new Set(items)).sort();
}

function writeOutputs(added, modified) {
  const allChangedTests = uniqueSorted([...added, ...modified]);
  const payload = {
    added,
    modified,
    tests: allChangedTests,
  };

  fs.writeFileSync(TEXT_OUTPUT_PATH, `${allChangedTests.join("\n")}${allChangedTests.length ? "\n" : ""}`);
  fs.writeFileSync(JSON_OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

try {
  const diffRange = getDiffRange();
  const changedLines = execSync(`git diff --name-status --diff-filter=AMRC ${diffRange}`, {
    encoding: "utf-8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const added = [];
  const modified = [];

  for (const line of changedLines) {
    const { code, file } = parseDiffLine(line);

    if (!TEST_FILE_PATTERN.test(file)) {
      continue;
    }

    if (code === "A") {
      added.push(file);
    } else {
      modified.push(file);
    }
  }

  writeOutputs(uniqueSorted(added), uniqueSorted(modified));

  for (const test of uniqueSorted([...added, ...modified])) {
    console.log(test);
  }
} catch (error) {
  console.error("Failed to detect changed tests.");
  console.error(error.message);

  process.exit(1);
}