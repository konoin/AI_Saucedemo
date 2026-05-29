const fs = require("fs");
const { spawnSync } = require("child_process");
const {
  REPORT_DIR,
  ensureDir,
  loadJson,
  normalizePath,
  unique,
  writeJson,
  writeLines,
} = require("./regression-utils");

const PLAN_PATH = "regression-plan.json";
const QUARANTINE_PATH = "framework/config/flaky-quarantine.json";
const RUN_METADATA_PATH = `${REPORT_DIR}/run-metadata.json`;

function loadQuarantine() {
  const config = loadJson(QUARANTINE_PATH, { quarantinedFiles: [], quarantinedTests: [] });
  return {
    files: new Set((config.quarantinedFiles || []).map(normalizePath)),
    tests: (config.quarantinedTests || []).map((entry) =>
      typeof entry === "string" ? { title: entry } : entry,
    ),
    raw: config,
  };
}

function isQuarantinedFile(testPath, quarantine) {
  return quarantine.files.has(normalizePath(testPath));
}

function getProjectArgs() {
  const projects = (process.env.REGRESSION_PROJECTS || process.env.PLAYWRIGHT_PROJECTS || "chromium")
    .split(",")
    .map((project) => project.trim())
    .filter(Boolean);

  return projects.flatMap((project) => [`--project=${project}`]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getGrepInvertArgs(quarantinedTestEntries) {
  const titles = quarantinedTestEntries
    .map((entry) => entry.title || entry.name)
    .filter(Boolean)
    .map(escapeRegExp);

  if (titles.length === 0) {
    return [];
  }

  return ["--grep-invert", titles.join("|")];
}

function createMetadata(overrides = {}) {
  return {
    generatedAt: new Date().toISOString(),
    status: "unknown",
    exitCode: 0,
    selectedTests: [],
    runnableTests: [],
    quarantinedTests: [],
    command: null,
    durationMs: 0,
    ...overrides,
  };
}

ensureDir(REPORT_DIR);

const startedAt = Date.now();
const plan = loadJson(PLAN_PATH, {
  selectedTests: [],
  changedTests: [],
  impactedTests: [],
});
const selectedTests = unique((plan.selectedTests || []).map(normalizePath));
const quarantine = loadQuarantine();
const runnableTests = selectedTests.filter((testPath) => !isQuarantinedFile(testPath, quarantine));
const quarantinedTests = selectedTests.filter((testPath) => isQuarantinedFile(testPath, quarantine));
const quarantinedTestTitles = quarantine.tests
  .map((entry) => entry.title || entry.name)
  .filter(Boolean);

writeLines("runnable-tests.txt", runnableTests);
writeLines("quarantined-tests.txt", quarantinedTests);

if (selectedTests.length === 0) {
  const metadata = createMetadata({
    status: "skipped",
    selectedTests,
    runnableTests,
    quarantinedTests,
    durationMs: Date.now() - startedAt,
  });
  writeJson(RUN_METADATA_PATH, metadata);
  console.log("No changed or impacted Playwright tests detected. Regression execution skipped.");
  process.exit(0);
}

if (runnableTests.length === 0) {
  const metadata = createMetadata({
    status: "quarantined",
    selectedTests,
    runnableTests,
    quarantinedTests,
    durationMs: Date.now() - startedAt,
  });
  writeJson(RUN_METADATA_PATH, metadata);
  console.log("All selected tests are currently quarantined. No Playwright execution was started.");
  process.exit(0);
}

const args = ["playwright", "test", ...runnableTests, ...getProjectArgs()];
args.push(...getGrepInvertArgs(quarantine.tests));
const command = `npx ${args.join(" ")}`;

console.log("Running selective Playwright regression:");
console.log(command);

const result = spawnSync("npx", args, {
  stdio: "inherit",
  env: {
    ...process.env,
    CI: process.env.CI || "true",
  },
});

const exitCode = result.status ?? 1;
const metadata = createMetadata({
  status: exitCode === 0 ? "completed" : "failed",
  exitCode,
  selectedTests,
  runnableTests,
  quarantinedTests: [...quarantinedTests, ...quarantinedTestTitles],
  command,
  durationMs: Date.now() - startedAt,
});

writeJson(RUN_METADATA_PATH, metadata);
process.exit(exitCode);
