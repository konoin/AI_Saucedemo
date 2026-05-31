const { execFileSync } = require("child_process");
const fs = require("fs");

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const TEXT_OUTPUT_PATH = "changed-tests.txt";
const JSON_OUTPUT_PATH = "changed-tests.json";

function getDiffArguments(args) {
  if (args.length >= 2) {
    return [`${args[0]}...${args[1]}`];
  }

  if (args.length === 1) {
    return [args[0]];
  }

  return ["HEAD~1...HEAD"];
}

function isInScopeTest(filePath) {
  return TEST_FILE_PATTERN.test(filePath);
}

function parseDiffLine(line) {
  const [status, firstPath, secondPath] = line.split("\t");
  const normalizedStatus = status.replace(/\d+$/, "");
  const filePath = normalizedStatus === "R" || normalizedStatus === "C"
    ? secondPath
    : firstPath;

  if (!filePath || !isInScopeTest(filePath)) {
    return null;
  }

  if (normalizedStatus === "A") {
    return { type: "added", filePath };
  }

  if (normalizedStatus === "M" || normalizedStatus === "R" || normalizedStatus === "C") {
    return { type: "modified", filePath };
  }

  return null;
}

try {
  const diffOutput = execFileSync(
    "git",
    ["diff", "--name-status", "--find-renames", ...getDiffArguments(process.argv.slice(2))],
    { encoding: "utf-8" },
  );

  const changes = diffOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDiffLine)
    .filter(Boolean);

  const changedTests = {
    added: [...new Set(changes.filter((change) => change.type === "added").map((change) => change.filePath))],
    modified: [...new Set(changes.filter((change) => change.type === "modified").map((change) => change.filePath))],
  };
  const allChangedTests = [...changedTests.added, ...changedTests.modified];

  fs.writeFileSync(TEXT_OUTPUT_PATH, `${allChangedTests.join("\n")}${allChangedTests.length ? "\n" : ""}`);
  fs.writeFileSync(
    JSON_OUTPUT_PATH,
    JSON.stringify({ ...changedTests, all: allChangedTests }, null, 2),
  );

  process.stdout.write(allChangedTests.join("\n"));
  if (allChangedTests.length > 0) {
    process.stdout.write("\n");
  }
} catch (error) {
  console.error("Failed to detect changed Playwright tests.");
  console.error(error.message);

  process.exit(1);
}