const fs = require("fs");
const path = require("path");

const reportPath =
  process.env.PLAYWRIGHT_JSON_REPORT || "playwright-report/results.json";
const changedTestsPath = "changed-tests.json";

function normalizeFile(file) {
  if (!file) {
    return "";
  }

  const relativeFile = path.isAbsolute(file)
    ? path.relative(process.cwd(), file)
    : file;
  const normalizedFile = relativeFile.split(path.sep).join("/");

  if (normalizedFile.startsWith("framework/tests/")) {
    return normalizedFile;
  }

  return `framework/tests/${normalizedFile}`;
}

function readList(fileName) {
  if (!fs.existsSync(fileName)) {
    return [];
  }

  return fs
    .readFileSync(fileName, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readChangedTests() {
  if (fs.existsSync(changedTestsPath)) {
    const changedTests = JSON.parse(fs.readFileSync(changedTestsPath, "utf-8"));
    return {
      added: changedTests.added || [],
      modified: changedTests.modified || [],
      changed: changedTests.changed || [],
    };
  }

  const changed = readList("changed-tests.txt");
  return {
    added: readList("added-tests.txt"),
    modified: readList("modified-tests.txt"),
    changed,
  };
}

function possibleCause(message = "") {
  const lower = message.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("selector") ||
    lower.includes("element(s) not found") ||
    lower.includes("strict mode violation")
  ) {
    return "locator not found";
  }

  if (
    lower.includes("expect(") ||
    lower.includes("expected") ||
    lower.includes("received") ||
    lower.includes("tocontaintext") ||
    lower.includes("tobevisible")
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
    lower.includes("api") ||
    lower.includes("network") ||
    lower.includes("request failed") ||
    lower.includes("waiting for response")
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

  return "test execution failure";
}

function extractMessages(result) {
  const messages = [];

  if (result.error?.message) {
    messages.push(result.error.message);
  }

  if (Array.isArray(result.errors)) {
    result.errors
      .map((error) => error?.message)
      .filter(Boolean)
      .forEach((message) => messages.push(message));
  }

  return messages;
}

function isFailed(test, result) {
  if (test.status) {
    return test.status === "unexpected";
  }

  return (
    result.status === "failed" ||
    result.status === "timedOut" ||
    result.status === "interrupted"
  );
}

function collectFailures(suites = [], failuresByFile = new Map()) {
  for (const suite of suites) {
    for (const spec of suite.specs || []) {
      const file = normalizeFile(spec.file);

      for (const test of spec.tests || []) {
        for (const result of test.results || []) {
          if (!isFailed(test, result)) {
            continue;
          }

          if (!failuresByFile.has(file)) {
            failuresByFile.set(file, {
              tests: new Set(),
              causes: new Set(),
            });
          }

          const failure = failuresByFile.get(file);
          failure.tests.add(spec.title);

          const messages = extractMessages(result);
          if (messages.length === 0) {
            failure.causes.add("test execution failure");
          } else {
            messages.forEach((message) =>
              failure.causes.add(possibleCause(message)),
            );
          }
        }
      }
    }

    collectFailures(suite.suites || [], failuresByFile);
  }

  return failuresByFile;
}

function appendFileList(lines, files) {
  if (files.length === 0) {
    lines.push("- None");
    return;
  }

  files.forEach((file) => lines.push(`- ${file}`));
}

function appendResult(
  lines,
  files,
  failuresByFile,
  successMessage,
  failureMessage,
) {
  const failedFiles = files.filter((file) => failuresByFile.has(file));

  lines.push("");
  lines.push("Result:");

  if (files.length === 0) {
    lines.push("No tests in this category.");
    return;
  }

  if (failedFiles.length === 0) {
    lines.push(successMessage);
    return;
  }

  const possibleCauses = [
    ...new Set(
      failedFiles.flatMap((file) => [
        ...(failuresByFile.get(file)?.causes || []),
      ]),
    ),
  ];

  lines.push(failureMessage);
  lines.push("");
  lines.push("Possible reasons:");
  possibleCauses.forEach((cause) => lines.push(`- ${cause}`));
}

const changedTests = readChangedTests();
let failuresByFile = new Map();

if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  failuresByFile = collectFailures(report.suites || []);
}

const lines = [];
lines.push("Lightweight QA Regression Summary");
lines.push("");
lines.push(`Repository: ${process.env.GITHUB_REPOSITORY || "local"}`);
lines.push(`Branch: ${process.env.GITHUB_REF_NAME || "local"}`);
lines.push("");

if (changedTests.changed.length === 0) {
  lines.push(
    "No added or modified Playwright tests detected under framework/tests.",
  );
  lines.push("");
  lines.push("Result:");
  lines.push("Regression not run.");
} else if (!fs.existsSync(reportPath)) {
  lines.push("Changed tests:");
  appendFileList(lines, changedTests.changed);
  lines.push("");
  lines.push("Result:");
  lines.push("Regression result was not available.");
  lines.push("");
  lines.push("Possible reasons:");
  lines.push("- test execution did not complete");
  lines.push("- Playwright JSON report missing");
} else {
  lines.push("Added tests:");
  appendFileList(lines, changedTests.added);
  appendResult(
    lines,
    changedTests.added,
    failuresByFile,
    "All newly added tests passed successfully.",
    "New tests failed during execution.",
  );

  lines.push("");
  lines.push("Modified tests:");
  appendFileList(lines, changedTests.modified);
  appendResult(
    lines,
    changedTests.modified,
    failuresByFile,
    "Modified tests passed successfully without detected issues.",
    "Regression failed.",
  );
}

if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
  lines.push("");
  lines.push("GitHub Actions Run:");
  lines.push(
    `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  );
}

console.log(lines.join("\n"));
