const fs = require("fs");
const path = require("path");

const REPORT_PATH = process.env.PLAYWRIGHT_JSON_REPORT || "playwright-report/results.json";
const CHANGED_TESTS_JSON = "changed-tests.json";
const CHANGED_TESTS_TXT = "changed-tests.txt";
const SUMMARY_PATH = "qa-regression-summary.txt";

function normalizeTestPath(filePath = "") {
  let normalized = filePath.replace(/\\/g, "/");

  if (path.isAbsolute(normalized)) {
    normalized = path.relative(process.cwd(), normalized).replace(/\\/g, "/");
  }

  const frameworkIndex = normalized.indexOf("framework/tests/");
  if (frameworkIndex >= 0) {
    return normalized.slice(frameworkIndex);
  }

  if (!normalized.startsWith("framework/tests/")) {
    return `framework/tests/${normalized}`;
  }

  return normalized;
}

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON)) {
    const changedTests = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON, "utf-8"));

    return {
      added: changedTests.added || [],
      modified: changedTests.modified || [],
      tests: changedTests.tests || [],
    };
  }

  if (fs.existsSync(CHANGED_TESTS_TXT)) {
    const tests = fs
      .readFileSync(CHANGED_TESTS_TXT, "utf-8")
      .split("\n")
      .map((test) => test.trim())
      .filter(Boolean);

    return { added: [], modified: tests, tests };
  }

  return { added: [], modified: [], tests: [] };
}

function classifyFailure(message = "", status = "") {
  const lower = `${message} ${status}`.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("getby") ||
    lower.includes("element") ||
    lower.includes("strict mode violation")
  ) {
    return "locator not found";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tohavetext") ||
    lower.includes("tocontaintext") ||
    lower.includes("tohaveurl")
  ) {
    return "assertion mismatch";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "timeout exceeded";
  }

  if (
    lower.includes("net::err") ||
    lower.includes("econnreset") ||
    lower.includes("api") ||
    lower.includes("network")
  ) {
    return "API/network failure";
  }

  if (lower.includes("navigation") || lower.includes("goto") || lower.includes("load")) {
    return "navigation failure";
  }

  return "page state issue";
}

function collectResultByFile(report) {
  const resultByFile = new Map();

  function ensureFile(filePath) {
    const normalized = normalizeTestPath(filePath);

    if (!resultByFile.has(normalized)) {
      resultByFile.set(normalized, { failed: false, reasons: new Set() });
    }

    return resultByFile.get(normalized);
  }

  function visitSuites(suites = [], inheritedFile = "") {
    for (const suite of suites) {
      const suiteFile = suite.file ? normalizeTestPath(suite.file) : inheritedFile;

      for (const spec of suite.specs || []) {
        const specFile = normalizeTestPath(spec.file || suiteFile);
        const fileResult = ensureFile(specFile);

        for (const test of spec.tests || []) {
          const finalResult = test.results?.[test.results.length - 1];

          if (!finalResult) {
            continue;
          }

          if (["failed", "timedOut", "interrupted"].includes(finalResult.status)) {
            const errorMessage = finalResult.error?.message || finalResult.errors?.[0]?.message || "";

            fileResult.failed = true;
            fileResult.reasons.add(classifyFailure(errorMessage, finalResult.status));
          }
        }
      }

      visitSuites(suite.suites || [], suiteFile);
    }
  }

  visitSuites(report.suites || []);

  return resultByFile;
}

function formatList(title, tests) {
  let output = `${title}:\n`;

  if (tests.length === 0) {
    return `${output}None\n\n`;
  }

  tests.forEach((test) => {
    output += `* ${test}\n`;
  });

  return `${output}\n`;
}

function formatResult({ tests, emptyMessage, passMessage, failMessage }, resultByFile, reportAvailable) {
  if (tests.length === 0) {
    return `Result:\n${emptyMessage}\n\n`;
  }

  if (!reportAvailable) {
    return "Result:\nRegression result unavailable; Playwright JSON report was not found.\n\n";
  }

  const missingResults = tests.filter((test) => !resultByFile.has(normalizeTestPath(test)));

  if (missingResults.length > 0) {
    return "Result:\nRegression result unavailable for one or more changed tests.\n\n";
  }

  const failures = tests
    .map((test) => resultByFile.get(normalizeTestPath(test)))
    .filter((result) => result?.failed);

  if (failures.length === 0) {
    return `Result:\n${passMessage}\n\n`;
  }

  const reasons = [...new Set(failures.flatMap((result) => [...result.reasons]))];
  let output = `Result:\n${failMessage}\n\nPossible reasons:\n`;

  reasons.forEach((reason) => {
    output += `* ${reason}\n`;
  });

  return `${output}\n`;
}

const changedTests = readChangedTests();
const reportAvailable = fs.existsSync(REPORT_PATH);
const resultByFile = reportAvailable
  ? collectResultByFile(JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8")))
  : new Map();

let summary = "Lightweight QA Regression Summary\n\n";

summary += formatList("Added tests", changedTests.added);
summary += formatResult(
  {
    tests: changedTests.added,
    emptyMessage: "No newly added Playwright tests detected.",
    passMessage: "All newly added tests passed successfully.",
    failMessage: "New tests failed during execution.",
  },
  resultByFile,
  reportAvailable,
);

summary += formatList("Modified tests", changedTests.modified);
summary += formatResult(
  {
    tests: changedTests.modified,
    emptyMessage: "No modified Playwright tests detected.",
    passMessage: "Modified tests passed successfully without detected issues.",
    failMessage: "Regression failed.",
  },
  resultByFile,
  reportAvailable,
);

fs.writeFileSync(SUMMARY_PATH, summary, "utf-8");
console.log(summary);
