const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function getArg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function normalizeFile(file) {
  return file.split(path.sep).join("/");
}

function uniqueSorted(files) {
  return [...new Set(files)].sort();
}

function writeList(fileName, files) {
  fs.writeFileSync(fileName, files.length ? `${files.join("\n")}\n` : "");
}

function parseDiffLine(line) {
  const parts = line.split("\t");
  const status = parts[0];
  const statusCode = status[0];
  const file = normalizeFile(parts[parts.length - 1] || "");

  return { statusCode, file };
}

try {
  const baseRef = getArg("base", process.env.BASE_REF || "origin/main");
  const headRef = getArg("head", process.env.HEAD_REF || "HEAD");
  const diffOutput = execSync(`git diff --name-status ${baseRef}...${headRef}`, {
    encoding: "utf-8",
  });

  const added = [];
  const modified = [];

  diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDiffLine)
    .filter(({ file }) => TEST_FILE_PATTERN.test(file))
    .forEach(({ statusCode, file }) => {
      if (statusCode === "A") {
        added.push(file);
      } else if (statusCode === "M" || statusCode === "R") {
        modified.push(file);
      }
    });

  const addedTests = uniqueSorted(added);
  const modifiedTests = uniqueSorted(modified);
  const changedTests = uniqueSorted([...addedTests, ...modifiedTests]);

  writeList("added-tests.txt", addedTests);
  writeList("modified-tests.txt", modifiedTests);
  writeList("changed-tests.txt", changedTests);
  fs.writeFileSync(
    "changed-tests.json",
    `${JSON.stringify(
      {
        added: addedTests,
        modified: modifiedTests,
        changed: changedTests,
      },
      null,
      2,
    )}\n`,
  );

  changedTests.forEach((test) => console.log(test));
} catch (error) {
  console.error("Failed to detect changed Playwright tests.");
  console.error(error.message);

  process.exit(1);
}