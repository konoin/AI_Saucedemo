const fs = require("fs");
const path = require("path");

const CHANGED_TESTS_PATH = "changed-tests.json";
const LEGACY_CHANGED_TESTS_PATH = "changed-tests.txt";
const REPORT_PATH = "playwright-report/results.json";
const OUTPUT_PATH = "qa-regression-summary.txt";

function normalizePath(filePath = "") {
  const normalized = filePath.split(path.sep).join("/");

  if (normalized.startsWith("framework/tests/")) {
    return normalized;
  }

  const testPathIndex = normalized.indexOf("/framework/tests/");
  if (testPathIndex >= 0) {
    return normalized.slice(testPathIndex + 1);
  }

  return `framework/tests/${normalized.replace(/^tests\//, "")}`;
}

function readChangedTests() {
  if (fs.existsSync(CHANGED_TESTS_PATH)) {
    const payload = JSON.parse(fs.readFileSync(CHANGED_TESTS_PATH, "utf-8"));

    return {
      added: payload.added ?? [],
      modified: payload.modified ?? [],
      tests: payload.tests ?? [...(payload.added ?? []), ...(payload.modified ?? [])],
    };
  }

  if (fs.existsSync(LEGACY_CHANGED_TESTS_PATH)) {
    const tests = fs
      .readFileSync(LEGACY_CHANGED_TESTS_PATH, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      added: [],
      modified: tests,
      tests,
    };
  }

  return {
    added: [],
    modified: [],
    tests: [],
  };
}

function classifyPossibleCause(message = "") {
  const lower = message.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("element(s) not found") ||
    lower.includes("waiting for") ||
    lower.includes("strict mode violation")
  ) {
    return "locator not found";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tocontaintext") ||
    lower.includes("tohavetext") ||
    lower.includes("tohaveurl")
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
    lower.includes("network")
  ) {
    return "API/network failure";
  }

  if (
    lower.includes("navigation") ||
    lower.includes("page.goto") ||
    lower.includes("target page") ||
    lower.includes("url")
  ) {
    return "navigation failure";
  }

  return "page state issue";
}

function collectSpecResults(suites = [], resultMap = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) {
      const file = normalizePath(spec.file);
      const current = resultMap.get(file) ?? {
        failed: false,
        causes: new Set(),
      };

      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) {
          if (["failed", "timedOut", "interrupted"].includes(result.status)) {
            current.failed = true;
            current.causes.add(classifyPossibleCause(result.error?.message ?? result.error?.stack ?? ""));
          }
        }
      }

      resultMap.set(file, current);
    }

    collectSpecResults(suite.suites ?? [], resultMap);
  }

  return resultMap;
}

function readPlaywrightResults() {
  if (!fs.existsSync(REPORT_PATH)) {
    return null;
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8"));

  return collectSpecResults(report.suites ?? []);
}

function listSection(title, tests) {
  let section = `${title}:\n`;

  if (tests.length === 0) {
    section += "- None\n";
  } else {
    section += tests.map((test) => `- ${test}`).join("\n");
    section += "\n";
  }

  return `${section}\n`;
}

function causesForTests(tests, results) {
  const causes = new Set();

  for (const test of tests) {
    const result = results?.get(test);

    if (result?.failed) {
      for (const cause of result.causes) {
        causes.add(cause);
      }
    }
  }

  return Array.from(causes);
}

function testsFailed(tests, results) {
  return tests.some((test) => results?.get(test)?.failed);
}

function resultSection(kind, tests, results) {
  if (tests.length === 0) {
    return "";
  }

  const failed = !results || testsFailed(tests, results);
  const label = kind === "Added" ? "New tests" : "Modified tests";

  let section = "Result:\n";

  if (!failed) {
    section +=
      kind === "Added"
        ? "All newly added tests passed successfully.\n"
        : "Modified tests passed successfully without detected issues.\n";

    return `${section}\n`;
  }

  section += kind === "Added" ? "New tests failed during execution.\n\n" : "Regression failed.\n\n";
  section += "Possible reasons:\n";

  const causes = causesForTests(tests, results);
  const fallbackCauses = kind === "Added" ? ["unstable locator", "page state issue", "API/network failure"] : ["locator not found", "assertion mismatch", "timeout exceeded"];

  for (const cause of causes.length > 0 ? causes : fallbackCauses) {
    section += `- ${cause}\n`;
  }

  section += `\n${label} reviewed: ${tests.length}\n`;

  return `${section}\n`;
}

const changedTests = readChangedTests();
const results = readPlaywrightResults();

let summary = "Lightweight QA Regression Summary\n\n";

if (changedTests.tests.length === 0) {
  summary += "Result:\nNo added or modified Playwright tests detected.\n\n";
  summary += "No regression execution required.\n";
} else {
  summary += listSection("Added tests", changedTests.added);
  summary += resultSection("Added", changedTests.added, results);
  summary += listSection("Modified tests", changedTests.modified);
  summary += resultSection("Modified", changedTests.modified, results);
}

fs.writeFileSync(OUTPUT_PATH, summary);
console.log(summary);
