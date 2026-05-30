const fs = require("fs");

const reportPath = "playwright-report/results.json";
const changedTestsPath = "changed-tests.txt";
const changedTestsJsonPath = "changed-tests.json";
const summaryPath = "qa-regression-summary.txt";

function readChangedTests() {
  if (fs.existsSync(changedTestsJsonPath)) {
    const changes = JSON.parse(fs.readFileSync(changedTestsJsonPath, "utf-8"));

    return {
      added: changes.added || [],
      modified: changes.modified || [],
      tests: changes.tests || [...(changes.added || []), ...(changes.modified || [])],
    };
  }

  if (!fs.existsSync(changedTestsPath)) {
    return { added: [], modified: [], tests: [] };
  }

  const tests = fs
    .readFileSync(changedTestsPath, "utf-8")
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);

  return { added: [], modified: tests, tests };
}

function normalizePath(file = "") {
  const normalized = file.replace(/\\/g, "/");

  if (normalized.startsWith("framework/tests/")) {
    return normalized;
  }

  const testsIndex = normalized.indexOf("framework/tests/");
  if (testsIndex >= 0) {
    return normalized.slice(testsIndex);
  }

  return `framework/tests/${normalized}`.replace(/\/+/g, "/");
}

function possibleReason(message = "", status = "") {
  const lower = message.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("element(s) not found") ||
    lower.includes("waiting for locator") ||
    lower.includes("strict mode violation")
  ) {
    return "locator not found";
  }

  if (status === "timedOut" || lower.includes("timeout")) {
    return "timeout exceeded";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("tohave") ||
    lower.includes("tocontain")
  ) {
    return "assertion mismatch";
  }

  if (
    lower.includes("net::err") ||
    lower.includes("econn") ||
    lower.includes("api") ||
    lower.includes("request failed") ||
    lower.includes("response")
  ) {
    return "API/network failure";
  }

  if (lower.includes("navigation") || lower.includes("page.goto")) {
    return "navigation failure";
  }

  return "test execution failure";
}

function collectFinalFailures(suites = [], failures = new Map()) {
  for (const suite of suites) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          const finalResult = test.results?.[test.results.length - 1];
          const finalStatus = finalResult?.status || test.status;

          if (!["failed", "timedOut", "interrupted"].includes(finalStatus)) {
            continue;
          }

          const file = normalizePath(spec.file || suite.file);
          const errorMessage =
            finalResult?.error?.message ||
            finalResult?.errors?.map((error) => error.message).join("\n") ||
            "";

          if (!failures.has(file)) {
            failures.set(file, new Set());
          }

          failures.get(file).add(possibleReason(errorMessage, finalStatus));
        }
      }
    }

    if (suite.suites) {
      collectFinalFailures(suite.suites, failures);
    }
  }

  return failures;
}

function formatList(tests) {
  if (tests.length === 0) {
    return "* None";
  }

  return tests.map((test) => `* ${test}`).join("\n");
}

function reasonsForTests(tests, failures) {
  const reasons = new Set();

  tests.forEach((test) => {
    const testReasons = failures.get(test);

    if (!testReasons) {
      return;
    }

    testReasons.forEach((reason) => reasons.add(reason));
  });

  return Array.from(reasons);
}

function appendSection(lines, title, tests, passMessage, failMessage, failures) {
  lines.push(`${title}:`);
  lines.push(formatList(tests));
  lines.push("");
  lines.push("Result:");

  if (tests.length === 0) {
    lines.push("No tests in this category.");
    lines.push("");
    return;
  }

  const reasons = reasonsForTests(tests, failures);

  if (reasons.length === 0) {
    lines.push(passMessage);
    lines.push("");
    return;
  }

  lines.push(failMessage);
  lines.push("");
  lines.push("Possible reasons:");
  reasons.forEach((reason) => lines.push(`* ${reason}`));
  lines.push("");
}

const changedTests = readChangedTests();
const summaryLines = ["Lightweight QA Regression Summary", ""];

if (changedTests.tests.length === 0) {
  summaryLines.push("No regression execution required.");
  summaryLines.push("");
  summaryLines.push(
    "No added or modified Playwright tests were detected under framework/tests/.",
  );
} else if (!fs.existsSync(reportPath)) {
  summaryLines.push("Result:");
  summaryLines.push("Regression execution did not produce Playwright JSON results.");
  summaryLines.push("");
  summaryLines.push("Possible reasons:");
  summaryLines.push("* test execution failure");
} else {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  const failures = collectFinalFailures(report.suites || []);

  appendSection(
    summaryLines,
    "Added tests",
    changedTests.added,
    "All newly added tests passed successfully.",
    "New tests failed during execution.",
    failures,
  );
  appendSection(
    summaryLines,
    "Modified tests",
    changedTests.modified,
    "Modified tests passed successfully without detected issues.",
    "Regression failed.",
    failures,
  );
}

const summary = `${summaryLines.join("\n").trim()}\n`;

fs.writeFileSync(summaryPath, summary);
console.log(summary);
