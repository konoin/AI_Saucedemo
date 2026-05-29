const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const DEFAULT_REPORT_PATH = "playwright-report/results.json";
const REPORT_DIR = "framework/reports";

function normalizePath(filePath = "") {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function isPlaywrightTest(filePath = "") {
  return TEST_FILE_PATTERN.test(normalizePath(filePath));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.warn(`Unable to parse ${filePath}: ${error.message}`);
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLines(filePath, lines) {
  const uniqueLines = [...new Set(lines.filter(Boolean))];
  fs.writeFileSync(filePath, uniqueLines.length ? `${uniqueLines.join("\n")}\n` : "");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function stripAnsi(value = "") {
  return value.replace(/\u001b\[[0-9;]*m/g, "");
}

function compactMessage(value = "", maxLines = 5) {
  const lines = stripAnsi(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("Call log:"));

  return lines.slice(0, maxLines).join(" | ") || "No failure message was captured.";
}

function hashRootCause(value = "") {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function formatDuration(ms = 0) {
  const safeMs = Math.max(Number(ms) || 0, 0);
  const seconds = Math.round(safeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function globToRegExp(pattern) {
  const normalized = normalizePath(pattern);
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__DOUBLE_STAR__/g, ".*");

  return new RegExp(`^${escaped}$`);
}

function matchesAnyPattern(filePath, patterns = []) {
  const normalized = normalizePath(filePath);
  return patterns.some((pattern) => globToRegExp(pattern).test(normalized));
}

function getResultError(result = {}) {
  if (result.error?.message) {
    return result.error.message;
  }

  if (result.error?.stack) {
    return result.error.stack;
  }

  if (Array.isArray(result.errors) && result.errors.length > 0) {
    return result.errors.map((error) => error.message || error.stack || String(error)).join("\n");
  }

  return "";
}

function isFailureStatus(status = "") {
  return ["failed", "timedOut", "interrupted"].includes(status);
}

function isSkippedStatus(status = "") {
  return ["skipped"].includes(status);
}

function classifyFailure(message = "", result = {}) {
  const lower = `${message} ${result.status || ""}`.toLowerCase();

  if (
    lower.includes("net::err") ||
    lower.includes("econnreset") ||
    lower.includes("enotfound") ||
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("apiresponse")
  ) {
    return "Network Failure";
  }

  if (
    lower.includes("browser has been closed") ||
    lower.includes("executable doesn't exist") ||
    lower.includes("process failed to launch") ||
    lower.includes("target page, context or browser has been closed") ||
    lower.includes("worker process exited")
  ) {
    return "Environment Failure";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tohavetext") ||
    lower.includes("tocontaintext") ||
    lower.includes("tobevisible") ||
    lower.includes("tohaveurl")
  ) {
    return "Assertion Failure";
  }

  if (
    lower.includes("locator") ||
    lower.includes("element(s) not found") ||
    lower.includes("strict mode violation") ||
    lower.includes("waiting for selector")
  ) {
    return "Locator Failure";
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("waiting for response") ||
    result.status === "timedOut"
  ) {
    return "Timeout";
  }

  return "Unknown Failure";
}

function collectSpecs(report = {}) {
  const specs = [];

  function visitSuite(suite = {}, parents = []) {
    const suiteTitle = suite.title && !suite.title.endsWith(".ts") ? suite.title : "";
    const nextParents = suiteTitle ? [...parents, suiteTitle] : parents;

    for (const spec of suite.specs || []) {
      const file = normalizePath(spec.file || suite.file || "");
      const titlePath = unique([...nextParents, spec.title]).join(" > ");
      specs.push({ ...spec, file, titlePath });
    }

    for (const childSuite of suite.suites || []) {
      visitSuite(childSuite, nextParents);
    }
  }

  for (const suite of report.suites || []) {
    visitSuite(suite);
  }

  return specs;
}

function getSpecResults(spec = {}) {
  const results = [];

  for (const test of spec.tests || []) {
    const projectName = test.projectName || test.projectId || "default";
    const testResults = test.results || [];
    const statuses = testResults.map((result) => result.status).filter(Boolean);
    const finalResult = testResults[testResults.length - 1] || {};
    const finalStatus = finalResult.status || test.status || "unknown";
    const hadFailureBeforePass =
      finalStatus === "passed" && statuses.slice(0, -1).some((status) => isFailureStatus(status));
    const failed = isFailureStatus(finalStatus);
    const skipped = isSkippedStatus(finalStatus);
    const error = testResults.map(getResultError).find(Boolean) || "";
    const category = hadFailureBeforePass
      ? "Flaky Test"
      : failed
        ? classifyFailure(error, finalResult)
        : null;
    const rootCause = compactMessage(error);

    results.push({
      file: spec.file,
      title: spec.title,
      titlePath: spec.titlePath || spec.title,
      projectName,
      statuses,
      finalStatus,
      failed,
      skipped,
      flaky: hadFailureBeforePass || test.outcome === "flaky",
      category,
      rootCause,
      durationMs: testResults.reduce((total, result) => total + (result.duration || 0), 0),
      attempts: testResults.length,
      rootCauseHash: hashRootCause(`${spec.file}:${spec.title}:${projectName}:${category}:${rootCause}`),
    });
  }

  return results;
}

function collectTestResults(report = {}) {
  return collectSpecs(report).flatMap(getSpecResults);
}

module.exports = {
  DEFAULT_REPORT_PATH,
  REPORT_DIR,
  TEST_FILE_PATTERN,
  classifyFailure,
  collectSpecs,
  collectTestResults,
  compactMessage,
  ensureDir,
  formatDuration,
  hashRootCause,
  isFailureStatus,
  isPlaywrightTest,
  loadJson,
  matchesAnyPattern,
  normalizePath,
  unique,
  writeJson,
  writeLines,
};
