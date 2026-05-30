const fs = require("fs");
const { execFileSync } = require("child_process");

const CHANGED_TESTS_TXT = "changed-tests.txt";
const CHANGED_TESTS_JSON = "changed-tests.json";
const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length === 1) {
    return [args[0]];
  }

  if (args.length >= 2) {
    return [args[0], args[1]];
  }

  if (process.env.GITHUB_BASE_REF) {
    return [`origin/${process.env.GITHUB_BASE_REF}...HEAD`];
  }

  return ["HEAD~1", "HEAD"];
}

function parseChangedTests(diffOutput) {
  const changes = {
    added: [],
    modified: [],
  };

  diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [status, file] = line.split("\t");

      if (!TEST_FILE_PATTERN.test(file)) {
        return;
      }

      if (status === "A") {
        changes.added.push(file);
      }

      if (status === "M") {
        changes.modified.push(file);
      }
    });

  return changes;
}

try {
  const diffOutput = execFileSync(
    "git",
    ["diff", "--name-status", "--diff-filter=AM", ...getDiffArgs()],
    { encoding: "utf-8" },
  );
  const changes = parseChangedTests(diffOutput);
  const tests = [...changes.added, ...changes.modified];
  const payload = { ...changes, tests };

  fs.writeFileSync(CHANGED_TESTS_TXT, tests.join("\n"));
  fs.writeFileSync(CHANGED_TESTS_JSON, `${JSON.stringify(payload, null, 2)}\n`);

  tests.forEach((test) => console.log(test));
} catch (error) {
  console.error("Failed to detect changed Playwright tests.");
  console.error(error.message);

  process.exit(1);
}