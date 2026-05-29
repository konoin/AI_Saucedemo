#!/usr/bin/env node

const fs = require("node:fs");

const REPORT_PATH =
  process.env.PLAYWRIGHT_JSON_REPORT || "playwright-report/results.json";
const CHANGED_TESTS_FILE = process.env.CHANGED_TESTS_FILE || "changed-tests.txt";
const EXECUTION_FILE =
  process.env.REGRESSION_EXECUTION_FILE || "regression-execution.json";
const SUMMARY_TEXT_FILE = process.env.REGRESSION_SUMMARY_FILE || "summary.txt";
const SUMMARY_JSON_FILE =
  process.env.REGRESSION_SUMMARY_JSON_FILE || "summary.json";
const FAILED_TESTS_FILE = process.env.FAILED_TESTS_FILE || "failed-tests.txt";
const PASSED_TESTS_FILE = process.env.PASSED_TESTS_FILE || "passed-tests.txt";

function readLines(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function classifyError(message = "") {
  const lower = message.toLowerCase();

  if (
    lower.includes("locator") ||
    lower.includes("element(s) not found") ||
    lower.includes("waiting for locator")
  ) {
    return "UI Locator Failure";
  }

  if (lower.includes("timeout") || lower.includes("waiting for response")) {
    return "Timeout Failure";
  }

  if (lower.includes("net::err") || lower.includes("econnreset")) {
    return "Network Failure";
  }

  if (lower.includes("expect(") || lower.includes("tocontaintext")) {
    return "Assertion Failure";
  }

  return "Unknown Failure";
}

function firstError(results = []) {
  for (const result of results) {
    const error = result.error?.message || result.errors?.[0]?.message;
    if (error) {
      return error.split("\n").slice(0, 8).join("\n");
    }
  }

  return "";
}

function finalResultStatus(results = []) {
  const lastResult = results[results.length - 1];
  return lastResult?.status || "unknown";
}

function fullTitle(suiteTitles, specTitle, projectName) {
  const title = [...suiteTitles, specTitle].filter(Boolean).join(" > ");
  return projectName ? `${title} [${projectName}]` : title;
}

function collectTests(suites = [], suiteTitles = []) {
  const tests = [];

  for (const suite of suites) {
    const nextTitles = suite.title ? [...suiteTitles, suite.title] : suiteTitles;

    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const status = test.status || test.outcome || finalResultStatus(test.results);
        const projectName = test.projectName || test.projectId || "";
        const title = fullTitle(nextTitles, spec.title, projectName);
        const error = firstError(test.results);
        const failed =
          status === "unexpected" ||
          status === "failed" ||
          ["failed", "timedOut", "interrupted"].includes(
            finalResultStatus(test.results),
          );

        tests.push({
          title,
          file: spec.file,
          status: failed ? "failed" : "passed",
          rawStatus: status,
          durationMs: (test.results || []).reduce(
            (total, result) => total + (result.duration || 0),
            0,
          ),
          failureType: failed ? classifyError(error) : "",
          error,
        });
      }
    }

    tests.push(...collectTests(suite.suites || [], nextTitles));
  }

  return tests;
}

function formatDuration(durationMs = 0) {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

function runUrl() {
  if (!process.env.GITHUB_REPOSITORY || !process.env.GITHUB_RUN_ID) {
    return "Unavailable outside GitHub Actions";
  }

  return `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
}

function writeGitHubOutput(summary) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const output = [
    `outcome=${summary.outcome}`,
    `executed_count=${summary.executedTests.length}`,
    `passed_count=${summary.passedTests.length}`,
    `failed_count=${summary.failedTests.length}`,
    `summary_file=${SUMMARY_TEXT_FILE}`,
    "",
  ].join("\n");

  fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
}

function buildSummary() {
  const changedTests = readLines(CHANGED_TESTS_FILE);
  const execution = readJson(EXECUTION_FILE, {
    status: changedTests.length === 0 ? "skipped" : "failed",
    executedTests: changedTests,
    exitCode: changedTests.length === 0 ? 0 : 1,
    durationMs: 0,
  });
  const report = readJson(REPORT_PATH);
  const parsedTests = report ? collectTests(report.suites || []) : [];
  const executedTests = execution.executedTests || changedTests;
  const failedTests = parsedTests.filter((test) => test.status === "failed");
  const passedTests = parsedTests.filter((test) => test.status === "passed");
  const reportMissingFailure =
    changedTests.length > 0 && execution.exitCode !== 0 && !report;
  const outcome =
    failedTests.length > 0 || reportMissingFailure || execution.exitCode !== 0
      ? "failed"
      : "passed";

  return {
    outcome,
    changedTests,
    executedTests,
    passedTests,
    failedTests,
    durationMs: execution.durationMs || report?.stats?.duration || 0,
    runUrl: runUrl(),
    generatedAt: new Date().toISOString(),
    repository: process.env.GITHUB_REPOSITORY || "local",
    branch: process.env.GITHUB_REF_NAME || "local",
    commit: process.env.GITHUB_SHA || "local",
    actor: process.env.GITHUB_ACTOR || "local",
    reportMissingFailure,
  };
}

function formatList(items, emptyMessage) {
  if (items.length === 0) {
    return `${emptyMessage}\n`;
  }

  return items.map((item) => `- ${item}`).join("\n") + "\n";
}

function formatTextSummary(summary) {
  const lines = [
    "AI Selective Playwright Regression Report",
    "",
    `Result: ${summary.outcome.toUpperCase()}`,
    `Repository: ${summary.repository}`,
    `Branch: ${summary.branch}`,
    `Commit: ${summary.commit}`,
    `Triggered by: ${summary.actor}`,
    `Generated at: ${summary.generatedAt}`,
    `Execution duration: ${formatDuration(summary.durationMs)}`,
    `GitHub Actions Run: ${summary.runUrl}`,
    "",
    `Changed test files (${summary.changedTests.length}):`,
    formatList(summary.changedTests, "No changed test files detected.").trimEnd(),
    "",
    `Executed test files (${summary.executedTests.length}):`,
    formatList(summary.executedTests, "No impacted test files executed.").trimEnd(),
    "",
    `Passed tests (${summary.passedTests.length}):`,
    formatList(
      summary.passedTests.map((test) => `${test.file} - ${test.title}`),
      "No passed tests recorded.",
    ).trimEnd(),
    "",
    `Failed tests (${summary.failedTests.length}):`,
  ];

  if (summary.failedTests.length === 0) {
    lines.push("No failed tests recorded.");
  } else {
    summary.failedTests.forEach((test, index) => {
      lines.push(`${index + 1}. ${test.file} - ${test.title}`);
      lines.push(`   Failure type: ${test.failureType}`);
      lines.push(`   Error: ${test.error || "No error message captured."}`);
    });
  }

  if (summary.reportMissingFailure) {
    lines.push("");
    lines.push("Playwright failed before producing a JSON report.");
  }

  return `${lines.join("\n")}\n`;
}

function main() {
  const summary = buildSummary();
  const textSummary = formatTextSummary(summary);

  fs.writeFileSync(SUMMARY_TEXT_FILE, textSummary);
  fs.writeFileSync(SUMMARY_JSON_FILE, `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(
    FAILED_TESTS_FILE,
    `${summary.failedTests.map((test) => test.title).join("\n")}${
      summary.failedTests.length ? "\n" : ""
    }`,
  );
  fs.writeFileSync(
    PASSED_TESTS_FILE,
    `${summary.passedTests.map((test) => test.title).join("\n")}${
      summary.passedTests.length ? "\n" : ""
    }`,
  );
  writeGitHubOutput(summary);

  console.log(textSummary);
}

main();
