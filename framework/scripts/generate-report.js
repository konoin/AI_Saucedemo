const fs = require("fs");
const path = require("path");

const CHANGED_TESTS_JSON_PATH = "changed-tests.json";
const CHANGED_TESTS_TEXT_PATH = "changed-tests.txt";
const PLAYWRIGHT_REPORT_PATH = "playwright-report/results.json";
const SUMMARY_OUTPUT_PATH = "qa-regression-summary.txt";

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_JSON_PATH)) {
    const changedTests = JSON.parse(fs.readFileSync(CHANGED_TESTS_JSON_PATH, "utf-8"));

    return {
      added: changedTests.added ?? [],
      modified: changedTests.modified ?? [],
    };
  }

  if (fs.existsSync(CHANGED_TESTS_TEXT_PATH)) {
    return {
      added: [],
      modified: fs
        .readFileSync(CHANGED_TESTS_TEXT_PATH, "utf-8")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };
  }

  return { added: [], modified: [] };
}

function normalizeTestPath(filePath) {
  if (!filePath) {
    return "";
  }

  const normalized = filePath.replace(/\\/g, "/");
  const frameworkIndex = normalized.indexOf("framework/tests/");

  if (frameworkIndex >= 0) {
    return normalized.slice(frameworkIndex);
  }

  if (!normalized.includes("/")) {
    return `framework/tests/${normalized}`;
  }

  return normalized;
}

function classifyFailure(message = "", status = "") {
  const lower = `${message} ${status}`.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("element(s) not found") ||
    lower.includes("strict mode violation")
  ) {
    return "locator not found";
  }

  if (
    lower.includes("expect") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tohave")
  ) {
    return "assertion mismatch";
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("waiting for")
  ) {
    return "timeout exceeded";
  }

  if (
    lower.includes("net::err") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("api") ||
    lower.includes("network") ||
    lower.includes("response")
  ) {
    return "API/network failure";
  }

  if (
    lower.includes("navigation") ||
    lower.includes("page.goto") ||
    lower.includes("load state")
  ) {
    return "navigation failure";
  }

  return "unexpected test error";
}

function collectResultMessage(result = {}) {
  const errors = result.errors ?? [];
  const messages = errors
    .map((error) => error.message || error.value || "")
    .filter(Boolean);

  if (result.error?.message) {
    messages.push(result.error.message);
  }

  return messages.join("\n");
}

function isFailedOutcome(test = {}, finalResult = {}) {
  return (
    test.status === "unexpected" ||
    ["failed", "timedOut", "interrupted"].includes(finalResult.status)
  );
}

function collectSpecOutcomes(suites = [], inheritedFile = "", outcomes = new Map()) {
  for (const suite of suites) {
    const suiteFile = suite.file || inheritedFile;

    for (const spec of suite.specs ?? []) {
      const specFile = normalizeTestPath(spec.file || suiteFile);

      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const finalResult = results[results.length - 1] ?? {};
        const failed = isFailedOutcome(test, finalResult);

        if (!outcomes.has(specFile)) {
          outcomes.set(specFile, { failed: false, reasons: new Set() });
        }

        const outcome = outcomes.get(specFile);

        if (failed) {
          outcome.failed = true;
          outcome.reasons.add(classifyFailure(collectResultMessage(finalResult), finalResult.status));
        }
      }
    }

    collectSpecOutcomes(suite.suites ?? [], suiteFile, outcomes);
  }

  return outcomes;
}

function readPlaywrightOutcomes() {
  if (!fs.existsSync(PLAYWRIGHT_REPORT_PATH)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(PLAYWRIGHT_REPORT_PATH, "utf-8"));
  return collectSpecOutcomes(report.suites ?? []);
}

function renderTestList(tests) {
  return tests.map((test) => `* ${test}`).join("\n");
}

function getCategoryReasons(tests, outcomes) {
  const reasons = new Set();

  for (const test of tests) {
    const outcome = outcomes.get(normalizeTestPath(test));

    if (outcome?.failed) {
      for (const reason of outcome.reasons) {
        reasons.add(reason);
      }
    }
  }

  return [...reasons];
}

function didCategoryFail(tests, outcomes) {
  return tests.some((test) => outcomes.get(normalizeTestPath(test))?.failed);
}

function renderCategory(title, tests, passMessage, failMessage, outcomes) {
  if (tests.length === 0) {
    return "";
  }

  const lines = [`${title}:`, "", renderTestList(tests), "", "Result:"];

  if (!outcomes) {
    lines.push("Regression result unavailable.");
    return `${lines.join("\n")}\n\n`;
  }

  if (!didCategoryFail(tests, outcomes)) {
    lines.push(passMessage);
    return `${lines.join("\n")}\n\n`;
  }

  lines.push(failMessage, "", "Possible reasons:");

  const reasons = getCategoryReasons(tests, outcomes);
  const renderedReasons = reasons.length > 0 ? reasons : ["unexpected test error"];
  lines.push("", ...renderedReasons.map((reason) => `* ${reason}`));

  return `${lines.join("\n")}\n\n`;
}

const changedTests = readChangedTests();
const allChangedTests = [...changedTests.added, ...changedTests.modified];
const outcomes = readPlaywrightOutcomes();

let summary = "Lightweight QA Regression Summary\n\n";

if (allChangedTests.length === 0) {
  summary += "No regression execution required.\n";
  summary += "No added or modified Playwright tests were detected under framework/tests.\n";
} else {
  summary += renderCategory(
    "Added tests",
    changedTests.added,
    "All newly added tests passed successfully.",
    "New tests failed during execution.",
    outcomes,
  );
  summary += renderCategory(
    "Modified tests",
    changedTests.modified,
    "Modified tests passed successfully without detected issues.",
    "Regression failed.",
    outcomes,
  );

  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
    summary += `GitHub Actions Run:\n`;
    summary += `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}\n`;
  }
}

fs.mkdirSync(path.dirname(SUMMARY_OUTPUT_PATH), { recursive: true });
fs.writeFileSync(SUMMARY_OUTPUT_PATH, summary, "utf-8");
console.log(summary);
