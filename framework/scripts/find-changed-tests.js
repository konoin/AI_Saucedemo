const fs = require("fs");
const { execFileSync } = require("child_process");

const CHANGED_TESTS_PATH = "changed-tests.txt";
const CHANGED_TESTS_JSON_PATH = "changed-tests.json";
const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length > 0) {
    return args;
  }

  return ["HEAD~1", "HEAD"];
}

function writeGitHubOutput(changedTests) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `tests<<EOF\n${changedTests.join("\n")}\nEOF\n`,
  );
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

try {
  const diffOutput = execFileSync(
    "git",
    [
      "diff",
      "--name-status",
      "--diff-filter=AM",
      ...getDiffArgs(),
    ],
    { encoding: "utf-8" },
  );

  const changedTests = {
    added: [],
    modified: [],
  };

  diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [status, file] = line.split(/\s+/);

      if (!TEST_FILE_PATTERN.test(file)) {
        return;
      }

      if (status === "A") {
        changedTests.added.push(file);
      }

      if (status === "M") {
        changedTests.modified.push(file);
      }
    });

  changedTests.added = uniqueSorted(changedTests.added);
  changedTests.modified = uniqueSorted(changedTests.modified);

  const allChangedTests = uniqueSorted([
    ...changedTests.added,
    ...changedTests.modified,
  ]);

  fs.writeFileSync(CHANGED_TESTS_PATH, `${allChangedTests.join("\n")}\n`);
  fs.writeFileSync(
    CHANGED_TESTS_JSON_PATH,
    `${JSON.stringify({ ...changedTests, all: allChangedTests }, null, 2)}\n`,
  );

  writeGitHubOutput(allChangedTests);

  if (allChangedTests.length === 0) {
    console.log("No added or modified Playwright tests detected.");
  } else {
    console.log("Detected added or modified Playwright tests:");
    allChangedTests.forEach((testPath) => console.log(`- ${testPath}`));
  }
} catch (error) {
  console.error("Failed to detect changed tests.");
  console.error(error.message);

  process.exit(1);
}