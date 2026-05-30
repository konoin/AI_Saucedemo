const fs = require("fs");
const { execFileSync } = require("child_process");

const TEST_FILE_PATTERN = /^framework\/tests\/.+\.(spec|test)\.ts$/;
const OUTPUT_TXT = "changed-tests.txt";
const OUTPUT_JSON = "changed-tests.json";

function parseDiffArgs() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    return args;
  }

  if (process.env.QA_DIFF_RANGE) {
    return process.env.QA_DIFF_RANGE.split(/\s+/).filter(Boolean);
  }

  return ["HEAD~1", "HEAD"];
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/").trim();
}

function addUnique(collection, filePath) {
  if (!collection.includes(filePath)) {
    collection.push(filePath);
  }
}

function parseNameStatusLine(line, changedTests) {
  const parts = line.split("\t").map(normalizePath).filter(Boolean);
  const status = parts[0];
  const filePath = status.startsWith("R") || status.startsWith("C")
    ? parts[2]
    : parts[1];

  if (!filePath || !TEST_FILE_PATTERN.test(filePath)) {
    return;
  }

  if (status === "A") {
    addUnique(changedTests.added, filePath);
    return;
  }

  if (status === "M" || status.startsWith("R") || status.startsWith("C")) {
    addUnique(changedTests.modified, filePath);
  }
}

function writeOutputs(changedTests) {
  const allTests = [...changedTests.added, ...changedTests.modified].sort();
  const output = {
    added: changedTests.added.sort(),
    modified: changedTests.modified.sort(),
    tests: allTests,
  };

  fs.writeFileSync(OUTPUT_TXT, allTests.join("\n") + (allTests.length ? "\n" : ""), "utf-8");
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2), "utf-8");

  if (allTests.length === 0) {
    console.log("No changed Playwright tests detected.");
    return;
  }

  if (output.added.length > 0) {
    console.log("Added tests:");
    output.added.forEach((test) => console.log(`- ${test}`));
  }

  if (output.modified.length > 0) {
    console.log("Modified tests:");
    output.modified.forEach((test) => console.log(`- ${test}`));
  }
}

try {
  const diffArgs = parseDiffArgs();
  const diffOutput = execFileSync(
    "git",
    ["diff", "--name-status", "--diff-filter=AMRC", ...diffArgs, "--", "framework/tests"],
    { encoding: "utf-8" },
  );
  const changedTests = { added: [], modified: [] };

  diffOutput
    .split("\n")
    .filter(Boolean)
    .forEach((line) => parseNameStatusLine(line, changedTests));

  writeOutputs(changedTests);
} catch (error) {
  console.error("Failed to detect changed tests.");
  console.error(error.message);
  process.exit(1);
}