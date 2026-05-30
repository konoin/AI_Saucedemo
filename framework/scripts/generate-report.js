const fs = require("fs");

const REPORT_PATH = "playwright-report/results.json";
const CHANGED_TESTS_PATH = "changed-tests.txt";
const CHANGED_TESTS_JSON_PATH = "changed-tests.json";
const SUMMARY_PATH = "qa-regression-summary.txt";
const TESTS_ROOT = "framework/tests/";

function normalizeTestPath(filePath = "") {
  const normalized = filePath.replace(/\\/g, "/");
  const testsRootIndex = normalized.indexOf(TESTS_ROOT);

  if (testsRootIndex >= 0) {
    return normalized.slice(testsRootIndex);
  }

  return `${TESTS_ROOT}${normalized}`;
}

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON_PATH)) {
    const changedTests = JSON.parse(
      fs.readFileSync(CHANGED_TESTS_JSON_PATH, "utf-8"),
    );

    return {
      added: changedTests.added || [],
      modified: changedTests.modified || [],
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_PATH)) {
    return { added: [], modified: [] };
  }

  return {
    added: [],
    modified: fs
      .readFileSync(CHANGED_TESTS_PATH, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };
}

function getFailureReason(message = "", status = "") {
  const lower = `${message} ${status}`.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("strict mode violation") ||
    lower.includes("element(s) not found") ||
    lower.includes("waiting for")
  ) {
    return "locator not found";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tohave") ||
    lower.includes("tocontain")
  ) {
    return "assertion mismatch";
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("exceeded")
  ) {
    return "timeout exceeded";
  }

  if (
    lower.includes("net::") ||
    lower.includes("econn") ||
    lower.includes("api") ||
    lower.includes("network") ||
    lower.includes("fetch")
  ) {
    return "API/network failure";
  }

  if (
    lower.includes("navigation") ||
    lower.includes("page.goto") ||
    lower.includes("goto") ||
    lower.includes("url")
  ) {
    return "navigation failure";
  }

  return "test execution issue";
}

function getFinalResult(test = {}) {
  const results = test.results || [];
  const finalResult = [...results].reverse().find((result) => result.status);
  const errorResult =
    [...results]
      .reverse()
      .find((result) =>
        ["failed", "timedOut", "interrupted"].includes(result.status),
      ) || finalResult;
  const message =
    errorResult?.error?.message ||
    errorResult?.errors?.map((error) => error.message).join("\n") ||
    "";

  return {
    status: test.status || finalResult?.status || "unknown",
    resultStatus: finalResult?.status || "unknown",
    reason: getFailureReason(message, errorResult?.status),
  };
}

function collectTestOutcomes(suites = [], outcomesByFile = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const filePath = normalizeTestPath(spec.file);

      if (!outcomesByFile.has(filePath)) {
        outcomesByFile.set(filePath, []);
      }

      for (const test of spec.tests || []) {
        outcomesByFile.get(filePath).push(getFinalResult(test));
      }
    }

    collectTestOutcomes(suite.suites || [], outcomesByFile);
  }

  return outcomesByFile;
}

function hasFailure(outcomes = []) {
  return outcomes.some((outcome) => {
    if (outcome.status === "unexpected" || outcome.status === "flaky") {
      return true;
    }

    return ["failed", "timedOut", "interrupted"].includes(
      outcome.resultStatus,
    );
  });
}

function buildCategorySummary(title, files, passMessage, failMessage, outcomes) {
  if (files.length === 0) {
    return "";
  }

  const failedFiles = files.filter((file) => {
    const fileOutcomes = outcomes.get(file);

    return !fileOutcomes || fileOutcomes.length === 0 || hasFailure(fileOutcomes);
  });
  const lines = [`${title}:`, ...files.map((file) => `* ${file}`), "", "Result:"];

  if (failedFiles.length === 0) {
    lines.push(passMessage, "");
    return lines.join("\n");
  }

  const reasons = new Set();

  failedFiles.forEach((file) => {
    const fileOutcomes = outcomes.get(file);

    if (!fileOutcomes || fileOutcomes.length === 0) {
      reasons.add("test execution issue");
      return;
    }

    for (const outcome of fileOutcomes) {
      if (hasFailure([outcome])) {
        reasons.add(outcome.reason);
      }
    }
  });

  lines.push(failMessage, "", "Possible reasons:");
  Array.from(reasons)
    .sort()
    .forEach((reason) => lines.push(`* ${reason}`));
  lines.push("");

  return lines.join("\n");
}

function writeSummary(summary) {
  fs.writeFileSync(SUMMARY_PATH, `${summary.trim()}\n`);
  console.log(summary.trim());
}

function buildFileList(title, files) {
  if (files.length === 0) {
    return "";
  }

  return `${title}:\n${files.map((file) => `* ${file}`).join("\n")}\n\n`;
}

const changedTests = readChangedTests();
const allChangedTests = [...changedTests.added, ...changedTests.modified];

if (allChangedTests.length === 0) {
  writeSummary(`Lightweight QA Regression Summary

No added or modified Playwright tests detected.

Result:
No regression execution required.`);
  process.exit(0);
}

if (!fs.existsSync(REPORT_PATH)) {
  writeSummary(`Lightweight QA Regression Summary

${buildFileList("Added tests", changedTests.added)}${buildFileList(
    "Modified tests",
    changedTests.modified,
  )}Result:
Regression result unavailable.

Possible reasons:
* test execution did not produce a Playwright JSON report`);
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8"));
const outcomes = collectTestOutcomes(report.suites || []);

const summary = `Lightweight QA Regression Summary

${buildCategorySummary(
  "Added tests",
  changedTests.added,
  "All newly added tests passed successfully.",
  "New tests failed during execution.",
  outcomes,
)}${buildCategorySummary(
  "Modified tests",
  changedTests.modified,
  "Modified tests passed successfully without detected issues.",
  "Regression failed.",
  outcomes,
)}`;

writeSummary(summary);
