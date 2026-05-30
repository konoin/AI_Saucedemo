const fs = require("fs");
const { execFileSync } = require("child_process");

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const CHANGED_TESTS_TEXT_PATH = "changed-tests.txt";
const CHANGED_TESTS_JSON_PATH = "changed-tests.json";

function resolveDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length >= 2) {
    return [args[0], args[1]];
  }

  return [args[0] || process.env.DIFF_RANGE || "origin/main...HEAD"];
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

function writeGithubOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<EOF\n${value}\nEOF\n`, "utf-8");
}

try {
  const diffArgs = resolveDiffArgs();
  const diffOutput = execFileSync(
    "git",
    [
      "diff",
      "--name-status",
      "--diff-filter=AM",
      ...diffArgs,
      "--",
      "framework/tests/**/*.spec.ts",
      "framework/tests/**/*.test.ts",
    ],
    { encoding: "utf-8" },
  );

  const changed = {
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
        changed.added.push(file);
      }

      if (status === "M") {
        changed.modified.push(file);
      }
    });

  changed.added = uniqueSorted(changed.added);
  changed.modified = uniqueSorted(changed.modified);
  changed.all = uniqueSorted([...changed.added, ...changed.modified]);

  fs.writeFileSync(CHANGED_TESTS_TEXT_PATH, changed.all.join("\n"), "utf-8");
  fs.writeFileSync(CHANGED_TESTS_JSON_PATH, `${JSON.stringify(changed, null, 2)}\n`, "utf-8");

  writeGithubOutput("tests", changed.all.join("\n"));
  writeGithubOutput("added", changed.added.join("\n"));
  writeGithubOutput("modified", changed.modified.join("\n"));

  if (changed.all.length === 0) {
    console.log("No added or modified Playwright tests detected.");
  } else {
    console.log("Detected Playwright test changes:");
    changed.added.forEach((test) => console.log(`A ${test}`));
    changed.modified.forEach((test) => console.log(`M ${test}`));
  }
} catch (error) {
  console.error("Failed to detect changed tests.");
  console.error(error.message);

  process.exit(1);
}