const fs = require("fs");

const CHANGED_TESTS_JSON = "changed-tests.json";
const CHANGED_TESTS_TXT = "changed-tests.txt";
const PLAYWRIGHT_RESULTS = "playwright-report/results.json";
const SUMMARY_FILE = "qa-regression-summary.txt";

function readJson(path, fallback) {
  if (!fs.existsSync(path)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

function readChangedTests() {
  const metadata = readJson(CHANGED_TESTS_JSON, null);

  if (metadata) {
    return {
      added: metadata.added || [],
      modified: metadata.modified || [],
      all: metadata.all || [...(metadata.added || []), ...(metadata.modified || [])],
    };
  }

  if (!fs.existsSync(CHANGED_TESTS_TXT)) {
    return { added: [], modified: [], all: [] };
  }

  const all = fs
    .readFileSync(CHANGED_TESTS_TXT, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return { added: [], modified: all, all };
}

function normalizeTestPath(filePath = "") {
  const normalized = filePath.replace(/\\/g, "/");
  const marker = "framework/tests/";
  const markerIndex = normalized.indexOf(marker);

  if (markerIndex >= 0) {
    return normalized.slice(markerIndex);
  }

  return `${marker}${normalized.replace(/^\.?\//, "")}`;
}

function classifyPossibleCause(message = "") {
  const lower = message.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("element(s) not found") ||
    lower.includes("waiting for locator")
  ) {
    return "locator not found";
  }

  if (lower.includes("expect(") || lower.includes("tohave") || lower.includes("tocontain")) {
    return "assertion mismatch";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "timeout exceeded";
  }

  if (
    lower.includes("net::") ||
    lower.includes("econn") ||
    lower.includes("api") ||
    lower.includes("network") ||
    lower.includes("request failed")
  ) {
    return "API/network failure";
  }

  if (lower.includes("navigation") || lower.includes("page.goto") || lower.includes("load state")) {
    return "navigation failure";
  }

  return "unexpected Playwright failure";
}

function isFinalFailure(test) {
  if (test.status) {
    return ["failed", "timedOut", "interrupted", "unexpected"].includes(test.status);
  }

  const lastResult = (test.results || []).at(-1);
  return lastResult ? !["passed", "skipped"].includes(lastResult.status) : false;
}

function extractErrorMessage(test) {
  const resultWithError = [...(test.results || [])]
    .reverse()
    .find((result) => result.error?.message);

  return resultWithError?.error?.message || "";
}

function collectResults(suites = [], changedFiles) {
  const results = new Map();

  changedFiles.forEach((file) => {
    results.set(file, { found: false, causes: new Set() });
  });

  function visit(suiteList = []) {
    suiteList.forEach((suite) => {
      (suite.specs || []).forEach((spec) => {
        const file = normalizeTestPath(spec.file);

        if (!results.has(file)) {
          return;
        }

        const fileResult = results.get(file);
        fileResult.found = true;

        (spec.tests || []).forEach((test) => {
          if (isFinalFailure(test)) {
            fileResult.causes.add(classifyPossibleCause(extractErrorMessage(test)));
          }
        });
      });

      visit(suite.suites || []);
    });
  }

  visit(suites);

  return results;
}

function formatList(files) {
  return files.map((file) => `* ${file}`).join("\n");
}

function formatPossibleReasons(causes) {
  const reasons = [...causes];

  if (reasons.length === 0) {
    return "";
  }

  return `\nPossible reasons:\n\n${reasons.map((reason) => `* ${reason}`).join("\n")}\n`;
}

function buildSection(title, files, passMessage, failMessage, results) {
  if (files.length === 0) {
    return "";
  }

  const causes = new Set();
  let hasFailure = false;
  let hasMissingResult = false;

  files.forEach((file) => {
    const result = results.get(file);

    if (!result?.found) {
      hasMissingResult = true;
      return;
    }

    if (result.causes.size > 0) {
      hasFailure = true;
      result.causes.forEach((cause) => causes.add(cause));
    }
  });

  let section = `${title}:\n\n${formatList(files)}\n\nResult:\n`;

  if (hasMissingResult) {
    return `${section}Regression result unavailable.\n\nPossible reasons:\n\n* Playwright JSON report not generated\n\n`;
  }

  if (hasFailure) {
    section += `${failMessage}\n`;
    section += formatPossibleReasons(causes);
    return `${section}\n`;
  }

  return `${section}${passMessage}\n\n`;
}

const changedTests = readChangedTests();
const changedFiles = changedTests.all || [];
let summary = "Lightweight QA Regression Summary\n\n";

if (changedFiles.length === 0) {
  summary += "No regression execution required.\n";
  fs.writeFileSync(SUMMARY_FILE, summary);
  console.log(summary);
  process.exit(0);
}

const playwrightReport = readJson(PLAYWRIGHT_RESULTS, null);
const results = playwrightReport ? collectResults(playwrightReport.suites || [], changedFiles) : new Map();

if (!playwrightReport) {
  changedFiles.forEach((file) => results.set(file, { found: false, causes: new Set() }));
}

summary += buildSection(
  "Added tests",
  changedTests.added || [],
  "All newly added tests passed successfully.",
  "New tests failed during execution.",
  results,
);

summary += buildSection(
  "Modified tests",
  changedTests.modified || [],
  "Modified tests passed successfully without detected issues.",
  "Regression failed.",
  results,
);

fs.writeFileSync(SUMMARY_FILE, summary);
console.log(summary);
