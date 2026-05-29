const fs = require("fs");
const {
  DEFAULT_REPORT_PATH,
  REPORT_DIR,
  collectTestResults,
  ensureDir,
  formatDuration,
  loadJson,
  unique,
  writeJson,
} = require("./regression-utils");

const PLAN_PATH = "regression-plan.json";
const RUN_METADATA_PATH = `${REPORT_DIR}/run-metadata.json`;
const CANDIDATES_PATH = `${REPORT_DIR}/flaky-quarantine-candidates.json`;
const REPORT_JSON_PATH = `${REPORT_DIR}/regression-report.json`;
const SUMMARY_PATH = "summary.txt";

function countBy(values, keySelector) {
  return values.reduce((counts, value) => {
    const key = keySelector(value);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function listItems(items, limit = 10) {
  if (items.length === 0) {
    return ["- None"];
  }

  const visible = items.slice(0, limit).map((item) => `- ${item}`);
  if (items.length > limit) {
    visible.push(`- ...and ${items.length - limit} more`);
  }

  return visible;
}

function resultName(result) {
  return `${result.title} [${result.projectName}] (${result.file})`;
}

function getRunUrl() {
  if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_RUN_ID) {
    return "Not available outside GitHub Actions.";
  }

  return `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

ensureDir(REPORT_DIR);

const plan = loadJson(PLAN_PATH, {
  changedTests: [],
  addedTests: [],
  modifiedTests: [],
  impactedTests: [],
  selectedTests: [],
});
const runMetadata = loadJson(RUN_METADATA_PATH, {
  status: "not_started",
  exitCode: 0,
  runnableTests: [],
  quarantinedTests: [],
  durationMs: 0,
});
const flakyAnalysis = loadJson(CANDIDATES_PATH, {
  flakyTests: [],
  quarantineCandidates: [],
});
const report = loadJson(DEFAULT_REPORT_PATH, null);
const testResults = report ? collectTestResults(report) : [];
const failedResults = testResults.filter((result) => result.failed);
const flakyResults = testResults.filter((result) => result.flaky);
const passedResults = testResults.filter((result) => result.finalStatus === "passed" && !result.flaky);
const uniqueFailures = Array.from(
  failedResults
    .reduce((failures, result) => {
      if (!failures.has(result.rootCauseHash)) {
        failures.set(result.rootCauseHash, result);
      }
      return failures;
    }, new Map())
    .values(),
);
const categoryCounts = countBy(uniqueFailures, (result) => result.category || "Unknown Failure");
const runUrl = getRunUrl();
const playwrightReportUrl = process.env.PLAYWRIGHT_REPORT_URL || `${runUrl}#artifacts`;
const status =
  failedResults.length > 0 || runMetadata.exitCode > 0
    ? "FAILED"
    : flakyResults.length > 0
      ? "PASSED_WITH_FLAKY"
      : runMetadata.status === "skipped"
        ? "SKIPPED"
        : "PASSED";

const reportPayload = {
  generatedAt: new Date().toISOString(),
  status,
  durationMs: runMetadata.durationMs,
  execution: {
    changedTests: plan.changedTests || [],
    addedTests: plan.addedTests || [],
    modifiedTests: plan.modifiedTests || [],
    impactedTests: plan.impactedTests || [],
    selectedTests: plan.selectedTests || [],
    runnableTests: runMetadata.runnableTests || [],
    quarantinedTests: runMetadata.quarantinedTests || [],
  },
  results: {
    passed: passedResults.map(resultName),
    failed: uniqueFailures.map((result) => ({
      name: resultName(result),
      category: result.category,
      rootCause: result.rootCause,
      attempts: result.attempts,
      statuses: result.statuses,
    })),
    flaky: flakyResults.map((result) => ({
      name: resultName(result),
      attempts: result.attempts,
      statuses: result.statuses,
    })),
    failureCategories: categoryCounts,
    quarantineCandidates: flakyAnalysis.quarantineCandidates || [],
  },
  links: {
    githubRun: runUrl,
    playwrightReport: playwrightReportUrl,
  },
};

writeJson(REPORT_JSON_PATH, reportPayload);

const lines = [
  "AI-Augmented Selective Regression Report",
  "========================================",
  "",
  `Status: ${status}`,
  `Duration: ${formatDuration(runMetadata.durationMs)}`,
  `Repository: ${process.env.GITHUB_REPOSITORY || "local"}`,
  `Branch: ${process.env.GITHUB_REF_NAME || process.env.GITHUB_HEAD_REF || "local"}`,
  `Triggered by: ${process.env.GITHUB_ACTOR || "local"}`,
  `Generated: ${reportPayload.generatedAt}`,
  "",
  "Links",
  "-----",
  `GitHub Actions run: ${runUrl}`,
  `Playwright report: ${playwrightReportUrl}`,
  "",
  "Execution Summary",
  "-----------------",
  `Changed test files: ${(plan.changedTests || []).length}`,
  `New tests: ${(plan.addedTests || []).length}`,
  `Modified tests: ${(plan.modifiedTests || []).length}`,
  `Impacted tests from dependency mapping: ${(plan.impactedTests || []).length}`,
  `Selected tests: ${(plan.selectedTests || []).length}`,
  `Runnable tests: ${(runMetadata.runnableTests || []).length}`,
  `Quarantined tests skipped: ${(runMetadata.quarantinedTests || []).length}`,
  "",
  "Result Summary",
  "--------------",
  `Passed tests: ${passedResults.length}`,
  `Failed tests: ${uniqueFailures.length}`,
  `Flaky tests: ${unique(flakyResults.map(resultName)).length}`,
  `Failure categories: ${
    Object.keys(categoryCounts).length
      ? Object.entries(categoryCounts)
          .map(([category, count]) => `${category}=${count}`)
          .join(", ")
      : "None"
  }`,
  "",
  "Changed Tests",
  "-------------",
  ...listItems(plan.changedTests || [], 15),
  "",
  "Passed Tests",
  "------------",
  ...listItems(unique(passedResults.map(resultName)), 15),
  "",
  "Failed Tests and Root Causes",
  "----------------------------",
];

if (uniqueFailures.length === 0) {
  lines.push("- None");
} else {
  uniqueFailures.forEach((result, index) => {
    lines.push(
      `${index + 1}. ${resultName(result)}`,
      `   Category: ${result.category}`,
      `   Root cause: ${result.rootCause}`,
      `   Attempts: ${result.attempts} (${result.statuses.join(" -> ")})`,
    );
  });
}

lines.push("", "Flaky Tests", "-----------");
if (flakyResults.length === 0) {
  lines.push("- None");
} else {
  unique(flakyResults.map(resultName)).forEach((name) => lines.push(`- ${name}`));
}

lines.push("", "Quarantine Recommendations", "--------------------------");
if (!flakyAnalysis.quarantineCandidates || flakyAnalysis.quarantineCandidates.length === 0) {
  lines.push("- None");
} else {
  flakyAnalysis.quarantineCandidates.slice(0, 10).forEach((candidate) => {
    lines.push(
      `- ${candidate.title} [${candidate.projectName}] (${candidate.file}) - flaky ${candidate.flakyRuns}/${candidate.observedRuns} observed runs`,
    );
  });
}

lines.push("");

const summary = `${lines.join("\n")}\n`;
fs.writeFileSync(SUMMARY_PATH, summary);
console.log(summary);
