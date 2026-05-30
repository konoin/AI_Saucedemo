const fs = require("fs");

const CHANGED_TESTS_TEXT_PATH = "changed-tests.txt";
const CHANGED_TESTS_JSON_PATH = "changed-tests.json";
const PLAYWRIGHT_REPORT_PATH = "playwright-report/results.json";
const SUMMARY_PATH = "qa-regression-summary.txt";

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function normalizeTestPath(file = "") {
  const normalized = file.replace(/\\/g, "/").replace(/^\.\//, "");
  const marker = "framework/tests/";
  const markerIndex = normalized.indexOf(marker);

  if (markerIndex >= 0) {
    return normalized.slice(markerIndex);
  }

  return `${marker}${normalized.replace(/^tests\//, "")}`;
}

function displayTestPath(file) {
  return normalizeTestPath(file).replace("framework/tests/", "");
}

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON_PATH)) {
    const parsed = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON_PATH, "utf-8"));
    const added = uniqueSorted((parsed.added || []).map(normalizeTestPath));
    const modified = uniqueSorted((parsed.modified || []).map(normalizeTestPath));

    return {
      added,
      modified,
      all: uniqueSorted([...(parsed.all || []), ...added, ...modified].map(normalizeTestPath)),
    };
  }

  if (fs.existsSync(CHANGED_TESTS_TEXT_PATH)) {
    const all = uniqueSorted(
      fs
        .readFileSync(CHANGED_TESTS_TEXT_PATH, "utf-8")
        .split("\n")
        .map((file) => file.trim())
        .filter(Boolean)
        .map(normalizeTestPath),
    );

    return { added: [], modified: all, all };
  }

  return { added: [], modified: [], all: [] };
}

function classifyFailure(message = "") {
  const lower = message.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("element(s) not found") ||
    lower.includes("strict mode violation") ||
    lower.includes("waiting for selector")
  ) {
    return "locator not found";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tocontain") ||
    lower.includes("tohave") ||
    lower.includes("tobe")
  ) {
    return "assertion mismatch";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "timeout exceeded";
  }

  if (
    lower.includes("net::") ||
    lower.includes("econnreset") ||
    lower.includes("api") ||
    lower.includes("request failed") ||
    lower.includes("response")
  ) {
    return "API/network failure";
  }

  if (
    lower.includes("navigation") ||
    lower.includes("page.goto") ||
    lower.includes("load state") ||
    lower.includes("page closed")
  ) {
    return "navigation failure";
  }

  return "test execution error";
}

function collectResults(suites = [], resultsByFile = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const file = normalizeTestPath(spec.file || suite.file || "");
      const entry =
        resultsByFile.get(file) ||
        {
          passed: 0,
          failed: 0,
          reasons: [],
        };

      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          if (result.status === "passed") {
            entry.passed += 1;
            continue;
          }

          if (["failed", "timedOut", "interrupted"].includes(result.status)) {
            const errorMessage =
              result.error?.message ||
              (result.errors || []).map((error) => error.message).join("\n") ||
              result.status;

            entry.failed += 1;
            entry.reasons.push(classifyFailure(errorMessage));
          }
        }
      }

      resultsByFile.set(file, entry);
    }

    collectResults(suite.suites || [], resultsByFile);
  }

  return resultsByFile;
}

function readPlaywrightResults() {
  if (!fs.existsSync(PLAYWRIGHT_REPORT_PATH)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(PLAYWRIGHT_REPORT_PATH, "utf-8"));
  return collectResults(report.suites || []);
}

function summarizeGroup({ title, files, passedMessage, failedMessage, resultsByFile }) {
  if (files.length === 0) {
    return "";
  }

  const failedFiles = [];
  const reasons = [];

  for (const file of files) {
    const result = resultsByFile?.get(normalizeTestPath(file));

    if (!result) {
      failedFiles.push(file);
      reasons.push("test result unavailable");
      continue;
    }

    if (result.failed > 0 || result.passed === 0) {
      failedFiles.push(file);
      reasons.push(...result.reasons);
    }
  }

  let section = `${title}:\n\n`;
  files.forEach((file) => {
    section += `* ${displayTestPath(file)}\n`;
  });

  section += "\nResult:\n";

  if (failedFiles.length === 0) {
    section += `${passedMessage}\n\n`;
    return section;
  }

  section += `${failedMessage}\n\n`;
  section += "Possible reasons:\n\n";

  uniqueSorted(reasons.length > 0 ? reasons : ["test execution error"]).forEach((reason) => {
    section += `* ${reason}\n`;
  });

  section += "\n";
  return section;
}

const changedTests = readChangedTests();
const resultsByFile = readPlaywrightResults();
let summary = "Lightweight QA Regression Summary\n\n";

if (changedTests.all.length === 0) {
  summary += "No added or modified Playwright tests detected.\n\n";
  summary += "Result:\n";
  summary += "No regression execution required.\n";
} else {
  summary += summarizeGroup({
    title: "Added tests",
    files: changedTests.added,
    passedMessage: "All newly added tests passed successfully.",
    failedMessage: "New tests failed during execution.",
    resultsByFile,
  });

  summary += summarizeGroup({
    title: "Modified tests",
    files: changedTests.modified,
    passedMessage: "Modified tests passed successfully without detected issues.",
    failedMessage: "Regression failed.",
    resultsByFile,
  });
}

fs.writeFileSync(SUMMARY_PATH, summary, "utf-8");
console.log(summary);
