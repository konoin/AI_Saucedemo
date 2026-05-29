#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_TEST_GLOBS = [
  "tests/**/*.spec.ts",
  "tests/**/*.test.ts",
  "framework/tests/**/*.spec.ts",
  "framework/tests/**/*.test.ts",
];

const OUTPUT_FILE = process.env.CHANGED_TESTS_FILE || "changed-tests.txt";
const OUTPUT_JSON_FILE =
  process.env.CHANGED_TESTS_JSON_FILE || "changed-tests.json";
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

function runGit(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function isAllZeroSha(sha = "") {
  return /^0+$/.test(sha);
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function globToRegExp(glob) {
  const normalized = normalizePath(glob.trim());
  let pattern = "";

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === "*" && next === "*") {
      const following = normalized[index + 2];
      if (following === "/") {
        pattern += "(?:.*/)?";
        index += 2;
      } else {
        pattern += ".*";
        index += 1;
      }
      continue;
    }

    if (char === "*") {
      pattern += "[^/]*";
      continue;
    }

    pattern += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  }

  return new RegExp(`^${pattern}$`);
}

function configuredPatterns() {
  const configured = process.env.PLAYWRIGHT_TEST_GLOBS;
  const globs = configured
    ? configured
        .split(",")
        .map((glob) => glob.trim())
        .filter(Boolean)
    : DEFAULT_TEST_GLOBS;

  return globs.map(globToRegExp);
}

function parseNameStatus(output) {
  const entries = output.split("\0").filter(Boolean);
  const changedFiles = [];

  for (let index = 0; index < entries.length; index += 1) {
    const status = entries[index];

    if (status.startsWith("R") || status.startsWith("C")) {
      const newFile = entries[index + 2];
      index += 2;
      changedFiles.push({ status: status[0], file: normalizePath(newFile) });
      continue;
    }

    const file = entries[index + 1];
    index += 1;

    if (file) {
      changedFiles.push({ status: status[0], file: normalizePath(file) });
    }
  }

  return changedFiles;
}

function resolveDiffRange() {
  const baseSha = process.env.BASE_SHA || process.env.GITHUB_EVENT_BEFORE;
  const headSha = process.env.HEAD_SHA || process.env.GITHUB_SHA || "HEAD";

  if (!baseSha || isAllZeroSha(baseSha)) {
    return [EMPTY_TREE, headSha];
  }

  return [baseSha, headSha];
}

function diffChangedFiles() {
  const [baseSha, headSha] = resolveDiffRange();

  try {
    return parseNameStatus(
      runGit(["diff", "--name-status", "-z", baseSha, headSha]),
    );
  } catch (error) {
    console.warn(
      `Unable to diff ${baseSha}..${headSha}; falling back to the head commit only.`,
    );
    return parseNameStatus(
      runGit(["show", "--name-status", "--format=", "-z", headSha]),
    );
  }
}

function writeGitHubOutput(changedTests) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const hasChangedTests = changedTests.length > 0 ? "true" : "false";
  const escapedList = changedTests.join("\n");
  const output = [
    `has_changed_tests=${hasChangedTests}`,
    `changed_count=${changedTests.length}`,
    "test_files<<EOF",
    escapedList,
    "EOF",
    "",
  ].join("\n");

  fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
}

function main() {
  const matchers = configuredPatterns();
  const changedFiles = diffChangedFiles();
  const changedTests = changedFiles
    .filter(({ status }) => ["A", "M", "R", "C", "T"].includes(status))
    .map(({ file }) => file)
    .filter((file) => matchers.some((matcher) => matcher.test(file)))
    .sort((left, right) => left.localeCompare(right));

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_JSON_FILE), { recursive: true });
  fs.writeFileSync(
    OUTPUT_FILE,
    `${changedTests.join("\n")}${changedTests.length ? "\n" : ""}`,
  );
  fs.writeFileSync(
    OUTPUT_JSON_FILE,
    `${JSON.stringify({ changedTests }, null, 2)}\n`,
  );

  writeGitHubOutput(changedTests);

  if (changedTests.length === 0) {
    console.error("No changed or newly added Playwright tests detected.");
    return;
  }

  console.error(
    `Detected ${changedTests.length} impacted Playwright test file(s).`,
  );
  changedTests.forEach((testFile) => console.log(testFile));
}

main();
