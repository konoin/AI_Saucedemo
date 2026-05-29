const {
  DEFAULT_REPORT_PATH,
  REPORT_DIR,
  collectTestResults,
  ensureDir,
  loadJson,
  writeJson,
  writeLines,
} = require("./regression-utils");

const HISTORY_PATH = process.env.FLAKY_HISTORY_PATH || ".regression-cache/flaky-history.json";
const CANDIDATES_PATH = `${REPORT_DIR}/flaky-quarantine-candidates.json`;
const FLAKY_TESTS_PATH = "flaky-tests.txt";
const threshold = Number(process.env.FLAKY_QUARANTINE_THRESHOLD || 3);

function getHistoryKey(result) {
  return `${result.file}::${result.title}::${result.projectName}`;
}

function createEmptyOutputs(reason) {
  const payload = {
    generatedAt: new Date().toISOString(),
    threshold,
    reason,
    flakyTests: [],
    quarantineCandidates: [],
  };
  ensureDir(REPORT_DIR);
  writeJson(CANDIDATES_PATH, payload);
  writeLines(FLAKY_TESTS_PATH, []);
  console.log(reason);
}

ensureDir(REPORT_DIR);

const report = loadJson(DEFAULT_REPORT_PATH, null);
if (!report) {
  createEmptyOutputs("Playwright JSON report not found. Flaky analysis skipped.");
  process.exit(0);
}

const history = loadJson(HISTORY_PATH, { tests: {} });
history.tests = history.tests || {};

const results = collectTestResults(report);
const flakyResults = results.filter((result) => result.flaky);
const now = new Date().toISOString();

for (const result of results) {
  const key = getHistoryKey(result);
  const previous = history.tests[key] || {
    file: result.file,
    title: result.title,
    projectName: result.projectName,
    observedRuns: 0,
    flakyRuns: 0,
    consecutiveFlakyRuns: 0,
    failureRuns: 0,
  };

  previous.observedRuns += 1;
  previous.lastSeenAt = now;
  previous.lastStatuses = result.statuses;
  previous.lastFinalStatus = result.finalStatus;

  if (result.flaky) {
    previous.flakyRuns += 1;
    previous.consecutiveFlakyRuns += 1;
  } else {
    previous.consecutiveFlakyRuns = 0;
  }

  if (result.failed) {
    previous.failureRuns += 1;
    previous.lastFailureCategory = result.category;
    previous.lastRootCause = result.rootCause;
  }

  history.tests[key] = previous;
}

const quarantineCandidates = Object.entries(history.tests)
  .filter(([, entry]) => entry.flakyRuns >= threshold || entry.consecutiveFlakyRuns >= threshold)
  .map(([key, entry]) => ({
    key,
    file: entry.file,
    title: entry.title,
    projectName: entry.projectName,
    flakyRuns: entry.flakyRuns,
    consecutiveFlakyRuns: entry.consecutiveFlakyRuns,
    observedRuns: entry.observedRuns,
    recommendation:
      "Add this file or test to framework/config/flaky-quarantine.json until the instability is fixed.",
  }));

const output = {
  generatedAt: now,
  threshold,
  flakyTests: flakyResults.map((result) => ({
    file: result.file,
    title: result.title,
    projectName: result.projectName,
    attempts: result.attempts,
    statuses: result.statuses,
    rootCause: result.rootCause,
  })),
  quarantineCandidates,
};

writeJson(HISTORY_PATH, history);
writeJson(CANDIDATES_PATH, output);
writeLines(
  FLAKY_TESTS_PATH,
  flakyResults.map((result) => `${result.file} :: ${result.title} [${result.projectName}]`),
);

console.log(
  `Flaky analysis complete. Current flaky tests: ${flakyResults.length}. Quarantine candidates: ${quarantineCandidates.length}.`,
);
