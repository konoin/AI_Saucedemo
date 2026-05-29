#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const CHANGED_TESTS_FILE = process.env.CHANGED_TESTS_FILE || "changed-tests.txt";
const EXECUTION_FILE =
  process.env.REGRESSION_EXECUTION_FILE || "regression-execution.json";

function readChangedTests() {
  if (!fs.existsSync(CHANGED_TESTS_FILE)) {
    return [];
  }

  return fs
    .readFileSync(CHANGED_TESTS_FILE, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function writeExecutionMetadata(metadata) {
  fs.writeFileSync(EXECUTION_FILE, `${JSON.stringify(metadata, null, 2)}\n`);
}

function main() {
  const testFiles = readChangedTests();
  const startedAt = new Date();

  if (testFiles.length === 0) {
    writeExecutionMetadata({
      status: "skipped",
      reason: "No changed or newly added Playwright tests were detected.",
      executedTests: [],
      exitCode: 0,
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 0,
    });
    console.log("Skipping Playwright: no impacted tests detected.");
    return;
  }

  const workers = process.env.PLAYWRIGHT_WORKERS || "2";
  const args = [
    "playwright",
    "test",
    ...testFiles,
    "--retries=0",
    `--workers=${workers}`,
  ];

  console.log(`Running ${testFiles.length} impacted Playwright test file(s).`);
  testFiles.forEach((testFile) => console.log(`- ${testFile}`));

  const result = spawnSync("npx", args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const completedAt = new Date();
  const exitCode =
    typeof result.status === "number" ? result.status : result.error ? 1 : 0;

  writeExecutionMetadata({
    status: exitCode === 0 ? "passed" : "failed",
    executedTests: testFiles,
    command: ["npx", ...args],
    exitCode,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
    error: result.error ? result.error.message : undefined,
  });

  if (result.error) {
    console.error(`Playwright failed to start: ${result.error.message}`);
  }

  process.exit(exitCode);
}

fs.mkdirSync(path.dirname(EXECUTION_FILE), { recursive: true });
main();
