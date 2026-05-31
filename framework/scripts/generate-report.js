const fs = require("fs");
const path = require("path");

const reportPath = "playwright-report/results.json";
const summaryPath = "qa-regression-summary.txt";
const changedTestsJsonPath = "changed-tests.json";
const changedTestsPath = "changed-tests.txt";

function normalizePath(filePath = "") {
  const normalized = filePath.replace(/\\/g, "/");

  if (path.isAbsolute(normalized)) {
    return path.relative(process.cwd(), normalized).replace(/\\/g, "/");
  }

  if (normalized.startsWith("framework/tests/")) {
    return normalized;
  }

  return `framework/tests/${normalized}`;
}

function readChangedTests() {
  if (fs.existsSync(changedTestsJsonPath)) {
    const changes = JSON.parse(fs.readFileSync(changedTestsJsonPath, "utf-8"));

    return {
      added: changes.added || [],
      modified: changes.modified || [],
    };
  }

  if (!fs.existsSync(changedTestsPath)) {
    return { added: [], modified: [] };
  }

  const modified = fs
    .readFileSync(changedTestsPath, "utf-8")
    .split("\n")
    .map((test) => test.trim())
    .filter(Boolean);

  return { added: [], modified };
}

function changedPathForSpec(specFile, changedTests) {
  const normalizedSpecFile = normalizePath(specFile);

  return changedTests.find((changedTest) => {
    const normalizedChangedTest = normalizePath(changedTest);

    return (
      normalizedSpecFile === normalizedChangedTest ||
      normalizedSpecFile.endsWith(`/${normalizedChangedTest}`) ||
      normalizedChangedTest.endsWith(`/${normalizedSpecFile}`)
    );
  });
}

function classifyPossibleCause(message = "") {
  const lower = message.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("test id") ||
    lower.includes("element(s) not found") ||
    lower.includes("waiting for")
  ) {
    return "locator not found";
  }

  if (lower.includes("expect(") || lower.includes("tohave") || lower.includes("tocontain")) {
    return "assertion mismatch";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "timeout exceeded";
  }

  if (lower.includes("net::") || lower.includes("econnreset") || lower.includes("api") || lower.includes("network")) {
    return "API/network failure";
  }

  if (lower.includes("navigation") || lower.includes("goto") || lower.includes("load state")) {
    return "navigation failure";
  }

  return "test execution failure";
}

function finalResultFor(test) {
  const results = test.results || [];

  return results[results.length - 1] || {};
}

function didTestFail(test) {
  const finalResult = finalResultFor(test);

  return test.outcome === "unexpected" || ["failed", "timedOut", "interrupted"].includes(finalResult.status);
}

function collectOutcomes(changedTests) {
  const outcomes = new Map(changedTests.map((test) => [normalizePath(test), { ran: false, failed: false, causes: new Set() }]));

  if (!fs.existsSync(reportPath)) {
    return { outcomes, hasReport: false };
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));

  function visitSuites(suites = []) {
    for (const suite of suites) {
      for (const spec of suite.specs || []) {
        const changedPath = changedPathForSpec(spec.file, changedTests);

        if (!changedPath) {
          continue;
        }

        const outcome = outcomes.get(normalizePath(changedPath));
        outcome.ran = true;

        for (const test of spec.tests || []) {
          if (!didTestFail(test)) {
            continue;
          }

          const finalResult = finalResultFor(test);
          const errorMessage = finalResult.error?.message || finalResult.errors?.[0]?.message || "";

          outcome.failed = true;
          outcome.causes.add(classifyPossibleCause(errorMessage));
        }
      }

      visitSuites(suite.suites || []);
    }
  }

  visitSuites(report.suites || []);

  return { outcomes, hasReport: true };
}

function appendTestList(lines, tests) {
  if (tests.length === 0) {
    lines.push("None detected.");
    return;
  }

  tests.forEach((test) => lines.push(`* ${test}`));
}

function appendGroupSummary(lines, label, tests, outcomes, hasReport) {
  lines.push(`${label} tests:`);
  appendTestList(lines, tests);
  lines.push("");

  if (tests.length === 0) {
    return;
  }

  const groupOutcomes = tests.map((test) => outcomes.get(normalizePath(test))).filter(Boolean);
  const failedOutcomes = groupOutcomes.filter((outcome) => outcome.failed);

  lines.push("Result:");

  if (!hasReport) {
    lines.push("Regression execution results were not available.");
    lines.push("");
    return;
  }

  if (failedOutcomes.length === 0) {
    lines.push(
      label === "Added"
        ? "All newly added tests passed successfully."
        : "Modified tests passed successfully without detected issues."
    );
    lines.push("");
    return;
  }

  lines.push(label === "Added" ? "New tests failed during execution." : "Regression failed.");
  lines.push("");
  lines.push("Possible reasons:");

  const possibleCauses = [...new Set(failedOutcomes.flatMap((outcome) => [...outcome.causes]))];
  possibleCauses.forEach((cause) => lines.push(`* ${cause}`));
  lines.push("");
}

const changedTests = readChangedTests();
const allChangedTests = [...changedTests.added, ...changedTests.modified];
const { outcomes, hasReport } = collectOutcomes(allChangedTests);
const lines = ["Lightweight QA Regression Summary", ""];

if (allChangedTests.length === 0) {
  lines.push("No added or modified Playwright tests detected under framework/tests.");
  lines.push("");
  lines.push("Result:");
  lines.push("No regression execution required.");
} else {
  appendGroupSummary(lines, "Added", changedTests.added, outcomes, hasReport);
  appendGroupSummary(lines, "Modified", changedTests.modified, outcomes, hasReport);
}

const summary = `${lines.join("\n").trim()}\n`;

fs.writeFileSync(summaryPath, summary);
console.log(summary);
