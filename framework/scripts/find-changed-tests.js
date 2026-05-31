const fs = require("fs");
const { execFileSync } = require("child_process");

const TEST_FILE_PATTERN = /^framework\/tests\/.+\.(spec|test)\.ts$/;
const diffRange = process.argv.slice(2).join(" ").trim() || process.env.DIFF_RANGE;

function getDiffArgs() {
  const args = ["diff", "--name-status", "--diff-filter=AM"];

  if (diffRange) {
    args.push(diffRange);
  } else {
    args.push("HEAD~1", "HEAD");
  }

  args.push("--", "framework/tests");

  return args;
}

function writeOutputs(added, modified) {
  const all = [...added, ...modified];

  fs.writeFileSync("changed-tests.txt", all.join("\n") + (all.length ? "\n" : ""));
  fs.writeFileSync(
    "changed-tests.json",
    `${JSON.stringify(
      {
        range: diffRange || "HEAD~1 HEAD",
        added,
        modified,
        all,
      },
      null,
      2,
    )}\n`,
  );
}

try {
  const diffOutput = execFileSync("git", getDiffArgs(), { encoding: "utf-8" });
  const added = [];
  const modified = [];

  diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [status, filePath] = line.split(/\t+/);

      if (!TEST_FILE_PATTERN.test(filePath)) {
        return;
      }

      if (status === "A") {
        added.push(filePath);
      }

      if (status === "M") {
        modified.push(filePath);
      }
    });

  added.sort();
  modified.sort();
  writeOutputs(added, modified);

  [...added, ...modified].forEach((test) => console.log(test));
} catch (error) {
  console.error("Failed to detect changed tests.");
  console.error(error.message);

  process.exit(1);
}