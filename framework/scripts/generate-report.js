const fs = require("fs");
const path = require("path");

const DEFAULT_RESULTS_PATH = "playwright-report/results.json";
const DEFAULT_SCOPE_PATH = "regression-artifacts/regression-scope.json";
const DEFAULT_OUTPUT_DIR = "regression-artifacts";

function parseArgs(argv) {
  const args = {
    results: process.env.PLAYWRIGHT_JSON_REPORT || DEFAULT_RESULTS_PATH,
    scope: process.env.REGRESSION_SCOPE_FILE || DEFAULT_SCOPE_PATH,
    outputDir: process.env.REGRESSION_ARTIFACT_DIR || DEFAULT_OUTPUT_DIR,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--results") {
      args.results = argv[++index];
    } else if (arg === "--scope") {
      args.scope = argv[++index];
    } else if (arg === "--output-dir") {
      args.outputDir = argv[++index];
    }
  }

  return args;
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function firstNonEmptyLine(text = "") {
  return text
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean) || "No error message captured";
}

function normalizeError(text = "") {
  return text
    .replace(/\d+ms/g, "<duration>")
    .replace(/\d+\.\d+s/g, "<duration>")
    .replace(/\d+/g, "<number>")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyFailure(message = "", status = "") {
  const lower = `${message}\n${status}`.toLowerCase();

  if (
    lower.includes("net::err") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("failed to fetch") ||
    lower.includes("api request failed") ||
    lower.includes("request failed")
  ) {
    return "Network Failure";
  }

  if (
    lower.includes("browser has been closed") ||
    lower.includes("browser closed") ||
    lower.includes("executable doesn't exist") ||
    lower.includes("cannot find module") ||
    lower.includes("worker process exited") ||
    lower.includes("process failed to launch")
  ) {
    return "Environment Failure";
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("waiting for response") ||
    lower.includes("navigation timeout")
  ) {
    return "Timeout";
  }

  if (
    lower.includes("locator") ||
    lower.includes("strict mode violation") ||
    lower.includes("element(s) not found") ||
    lower.includes("waiting for selector") ||
    lower.includes("waiting for getby")
  ) {
    return "Locator Failure";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tocontaintext") ||
    lower.includes("tohaveurl") ||
    lower.includes("toequal")
  ) {
    return "Assertion Failure";
  }

  return "Unknown Failure";
}

function extractLocator(message = "") {
  const locatorPatterns = [
    /locator\((['"`].+?['"`])\)/,
    /getBy[A-Za-z]+\((['"`].+?['"`])\)/,
    /waiting for (?:selector|locator)\s+(.+)/i,
  ];

  for (const pattern of locatorPatterns) {
    const match = message.match(pattern);

    if (match) {
      return match[1].replace(/^['"`]|['"`]$/g, "");
    }
  }

  return "";
}

function extractAssertion(message = "") {
  const lines = message.split("\n").map((line) => line.trim()).filter(Boolean);
  const relevant = lines.filter((line) =>
    /expected|received|expect\(|toContainText|toHaveURL|toEqual/i.test(line),
  );

  return relevant.slice(0, 4).join(" | ");
}

function buildRootCause(category, message, status) {
  const locator = extractLocator(message);
  const assertion = extractAssertion(message);
  const headline = firstNonEmptyLine(message);

  if (category === "Locator Failure") {
    return locator
      ? `Locator did not resolve or match expected UI state: ${locator}`
      : `UI element lookup failed: ${headline}`;
  }

  if (category === "Assertion Failure") {
    return assertion || `Assertion mismatch: ${headline}`;
  }

  if (category === "Timeout") {
    return `Operation exceeded its timeout while waiting for page, locator, assertion, or navigation: ${headline}`;
  }

  if (category === "Network Failure") {
    return `Network or API dependency failed during test execution: ${headline}`;
  }

  if (category === "Environment Failure") {
    return `Test infrastructure or browser environment failed: ${headline}`;
  }

  if (category === "Flaky Test") {
    return `Test recovered after retry; first failed attempt was classified as ${status || "Unknown Failure"}.`;
  }

  return headline;
}

function formatDuration(milliseconds = 0) {
  if (!milliseconds || milliseconds < 0) {
    return "0s";
  }

  const seconds = Math.round(milliseconds / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function collectSpecs(suites = [], parentTitles = []) {
  const specs = [];

  for (const suite of suites) {
    const suiteTitle = suite.title ? [...parentTitles, suite.title] : parentTitles;

    for (const spec of suite.specs || []) {
      specs.push({ suiteTitles: suiteTitle, spec });
    }

    specs.push(...collectSpecs(suite.suites || [], suiteTitle));
  }

  return specs;
}

function getErrorMessage(result = {}) {
  const errors = result.errors || [];
  const messages = errors.map((error) => error.message || error.stack).filter(Boolean);

  if (result.error?.message || result.error?.stack) {
    messages.unshift(result.error.message || result.error.stack);
  }

  return messages.join("\n") || result.status || "Unknown error";
}

function getProjectName(test) {
  return test.projectName || test.projectId || "default";
}

function analyzeResults(results, scope) {
  if (!results) {
    const selectedCount = scope.selectedTests?.length || 0;
    return {
      status: selectedCount === 0 ? "SKIPPED" : "FAILED",
      executionDurationMs: 0,
      passedTests: [],
      failedTests: selectedCount === 0 ? [] : scope.selectedTests.map((file) => ({
        title: path.basename(file),
        file,
        project: "not-started",
        category: "Environment Failure",
        rootCause: "Playwright JSON report was not produced.",
        attempts: 0,
        fingerprint: `missing-report:${file}`,
      })),
      flakyTests: [],
      skippedTests: [],
      failureCategories: selectedCount === 0 ? {} : { "Environment Failure": selectedCount },
      duplicateFailureCount: 0,
    };
  }

  const passedTests = [];
  const failedTestsByFingerprint = new Map();
  const flakyTests = [];
  const skippedTests = [];
  let duplicateFailureCount = 0;
  let executionDurationMs = 0;

  for (const { suiteTitles, spec } of collectSpecs(results.suites || [])) {
    for (const test of spec.tests || []) {
      const resultsForTest = test.results || [];
      const finalResult = resultsForTest[resultsForTest.length - 1] || {};
      const failedAttempts = resultsForTest.filter((result) =>
        ["failed", "timedOut", "interrupted"].includes(result.status),
      );
      const hasPassedAttempt = resultsForTest.some((result) => result.status === "passed");
      const titlePath = [...suiteTitles, spec.title].filter(Boolean).join(" > ");
      const project = getProjectName(test);
      const file = spec.file || "";

      executionDurationMs += resultsForTest.reduce(
        (total, result) => total + (result.duration || 0),
        0,
      );

      if (test.status === "skipped" || finalResult.status === "skipped") {
        skippedTests.push({ title: titlePath, file, project });
        continue;
      }

      if (failedAttempts.length > 0 && hasPassedAttempt) {
        const firstFailure = failedAttempts[0];
        const message = getErrorMessage(firstFailure);
        const firstFailureCategory = classifyFailure(message, firstFailure.status);

        flakyTests.push({
          title: titlePath,
          file,
          project,
          category: "Flaky Test",
          firstFailureCategory,
          rootCause: buildRootCause("Flaky Test", message, firstFailureCategory),
          attempts: resultsForTest.length,
        });
        continue;
      }

      if (finalResult.status === "passed" || test.status === "expected") {
        passedTests.push({ title: titlePath, file, project });
        continue;
      }

      const failureResult = failedAttempts[failedAttempts.length - 1] || finalResult;
      const message = getErrorMessage(failureResult);
      const category = classifyFailure(message, failureResult.status);
      const fingerprint = `${file}:${titlePath}:${project}:${category}:${normalizeError(message).slice(0, 240)}`;
      const failure = {
        title: titlePath,
        file,
        project,
        category,
        rootCause: buildRootCause(category, message, failureResult.status),
        errorSummary: firstNonEmptyLine(message),
        locator: extractLocator(message),
        attempts: resultsForTest.length,
        retryFailures: Math.max(0, failedAttempts.length - 1),
        fingerprint,
      };

      if (failedTestsByFingerprint.has(fingerprint)) {
        duplicateFailureCount += 1;
        failedTestsByFingerprint.get(fingerprint).duplicateCount += 1;
      } else {
        failedTestsByFingerprint.set(fingerprint, { ...failure, duplicateCount: 0 });
      }
    }
  }

  const failedTests = [...failedTestsByFingerprint.values()];
  const failureCategories = failedTests.reduce((categories, failure) => {
    categories[failure.category] = (categories[failure.category] || 0) + 1;
    return categories;
  }, {});

  return {
    status: failedTests.length > 0 ? "FAILED" : "PASSED",
    executionDurationMs,
    passedTests,
    failedTests,
    flakyTests,
    skippedTests,
    failureCategories,
    duplicateFailureCount,
  };
}

function asBulletList(items, emptyText, formatter = (item) => item) {
  if (!items || items.length === 0) {
    return `- ${emptyText}\n`;
  }

  return items.map((item) => `- ${formatter(item)}\n`).join("");
}

function buildSummary(report) {
  const lines = [];
  const scope = report.scope;
  const runUrl = report.links.githubActionsRun;
  const playwrightReportUrl = report.links.playwrightReportArtifact;

  lines.push("# AI-Augmented Regression Report");
  lines.push("");
  lines.push(`Status: ${report.status}`);
  lines.push(`Repository: ${report.repository || "local"}`);
  lines.push(`Branch: ${report.branch || "local"}`);
  lines.push(`Commit: ${report.commit || "local"}`);
  lines.push(`Triggered by: ${report.triggeredBy || "local"}`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Execution duration: ${formatDuration(report.executionDurationMs)}`);
  lines.push(`GitHub Actions run: ${runUrl || "local run"}`);
  lines.push(`Playwright report: ${playwrightReportUrl || "playwright-report artifact"}`);
  lines.push("");
  lines.push("## Execution Summary");
  lines.push(`- Changed tests: ${scope.changedTests.length}`);
  lines.push(`- Impacted tests: ${scope.impactedTests.length}`);
  lines.push(`- Selected tests executed: ${scope.selectedTests.length}`);
  lines.push(`- Passed tests: ${report.passedTests.length}`);
  lines.push(`- Failed tests: ${report.failedTests.length}`);
  lines.push(`- Flaky tests: ${report.flakyTests.length}`);
  lines.push(`- Skipped/quarantined tests: ${report.skippedTests.length + scope.excludedQuarantinedTests.length}`);
  lines.push("");
  lines.push("## Changed Tests");
  lines.push(asBulletList(scope.changedTests, "No changed Playwright test files detected.").trimEnd());
  lines.push("");
  lines.push("## Passed Tests");
  lines.push(asBulletList(report.passedTests, "No tests passed or no tests were selected.", (test) => `${test.title} (${test.project})`).trimEnd());
  lines.push("");
  lines.push("## Failed Tests");

  if (report.failedTests.length === 0) {
    lines.push("- No failed tests.");
  } else {
    for (const failure of report.failedTests) {
      lines.push(`- ${failure.title} (${failure.project})`);
      lines.push(`  - File: ${failure.file}`);
      lines.push(`  - Category: ${failure.category}`);
      lines.push(`  - Root cause: ${failure.rootCause}`);
      if (failure.locator) {
        lines.push(`  - Failed locator: ${failure.locator}`);
      }
      if (failure.duplicateCount > 0) {
        lines.push(`  - Duplicate retry/root-cause occurrences suppressed: ${failure.duplicateCount}`);
      }
    }
  }

  lines.push("");
  lines.push("## Flaky Tests");

  if (report.flakyTests.length === 0) {
    lines.push("- No flaky behavior detected.");
  } else {
    for (const flaky of report.flakyTests) {
      lines.push(`- ${flaky.title} (${flaky.project})`);
      lines.push(`  - File: ${flaky.file}`);
      lines.push(`  - First failure category: ${flaky.firstFailureCategory}`);
      lines.push(`  - Retry attempts: ${flaky.attempts}`);
      lines.push(`  - Root cause: ${flaky.rootCause}`);
    }
  }

  lines.push("");
  lines.push("## Failure Categories");

  if (Object.keys(report.failureCategories).length === 0) {
    lines.push("- No failure categories recorded.");
  } else {
    for (const [category, count] of Object.entries(report.failureCategories)) {
      lines.push(`- ${category}: ${count}`);
    }
  }

  lines.push("");
  lines.push("## Quarantine");

  if (scope.excludedQuarantinedTests.length === 0) {
    lines.push("- No selected tests were excluded by quarantine.");
  } else {
    for (const test of scope.excludedQuarantinedTests) {
      lines.push(`- ${test}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.outputDir, { recursive: true });

  const scope = readJsonIfExists(args.scope, {
    changedTests: [],
    impactedTests: [],
    selectedTests: [],
    excludedQuarantinedTests: [],
  });
  const results = readJsonIfExists(args.results, null);
  const analysis = analyzeResults(results, scope);
  const runUrl = process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "";

  const report = {
    generatedAt: new Date().toISOString(),
    repository: process.env.GITHUB_REPOSITORY || "",
    branch: process.env.GITHUB_REF_NAME || "",
    commit: process.env.GITHUB_SHA || "",
    triggeredBy: process.env.GITHUB_ACTOR || "",
    links: {
      githubActionsRun: runUrl,
      playwrightReportArtifact: runUrl ? `${runUrl}#artifacts` : "",
    },
    scope: {
      changedTests: scope.changedTests || [],
      impactedTests: scope.impactedTests || [],
      impactedAreas: scope.impactedAreas || [],
      selectedTests: scope.selectedTests || [],
      excludedQuarantinedTests: scope.excludedQuarantinedTests || [],
    },
    ...analysis,
  };

  const summary = buildSummary(report);
  const reportJsonPath = path.join(args.outputDir, "regression-report.json");
  const summaryPath = path.join(args.outputDir, "summary.md");

  fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(summaryPath, summary);
  fs.writeFileSync("summary.txt", summary);

  console.log(summary);
}

try {
  main();
} catch (error) {
  console.error(`Failed to generate regression report: ${error.message}`);
  process.exit(1);
}
