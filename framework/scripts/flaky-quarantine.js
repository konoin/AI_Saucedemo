const fs = require("fs");
const path = require("path");

const DEFAULT_REPORT_PATH = "regression-artifacts/regression-report.json";
const DEFAULT_QUARANTINE_PATH = "framework/regression/flaky-quarantine.json";
const DEFAULT_OUTPUT_DIR = "regression-artifacts";

function parseArgs(argv) {
  const args = {
    report: process.env.REGRESSION_REPORT_FILE || DEFAULT_REPORT_PATH,
    quarantine: process.env.FLAKY_QUARANTINE_FILE || DEFAULT_QUARANTINE_PATH,
    outputDir: process.env.REGRESSION_ARTIFACT_DIR || DEFAULT_OUTPUT_DIR,
    threshold: Number(process.env.FLAKY_QUARANTINE_THRESHOLD || 2),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--report") {
      args.report = argv[++index];
    } else if (arg === "--quarantine") {
      args.quarantine = argv[++index];
    } else if (arg === "--output-dir") {
      args.outputDir = argv[++index];
    } else if (arg === "--threshold") {
      args.threshold = Number(argv[++index]);
    }
  }

  return args;
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function normalizePath(filePath = "") {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function getKnownQuarantinedTests(quarantineConfig) {
  const entries = Array.isArray(quarantineConfig)
    ? quarantineConfig
    : quarantineConfig.quarantinedTests || [];
  const today = new Date().toISOString().slice(0, 10);

  return entries
    .filter((entry) => entry && entry.active !== false)
    .filter((entry) => !entry.expiresOn || entry.expiresOn >= today)
    .map((entry) => ({
      file: normalizePath(entry.file || entry.test),
      reason: entry.reason || "Repeated flaky behavior",
      ticket: entry.ticket || "",
      expiresOn: entry.expiresOn || "",
    }))
    .filter((entry) => Boolean(entry.file));
}

function buildCandidate(flakyTest, threshold) {
  return {
    file: normalizePath(flakyTest.file),
    title: flakyTest.title,
    project: flakyTest.project,
    reason: `Passed after retry with first failure category: ${flakyTest.firstFailureCategory}`,
    attempts: flakyTest.attempts,
    recommendation:
      flakyTest.attempts >= threshold
        ? "Candidate for quarantine until the root cause is fixed."
        : "Monitor; below quarantine threshold.",
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.outputDir, { recursive: true });

  const report = readJsonIfExists(args.report, {
    flakyTests: [],
    scope: { excludedQuarantinedTests: [] },
  });
  const quarantineConfig = readJsonIfExists(args.quarantine, {
    threshold: args.threshold,
    quarantinedTests: [],
  });
  const threshold = Number(quarantineConfig.threshold || args.threshold || 2);
  const knownQuarantinedTests = getKnownQuarantinedTests(quarantineConfig);
  const knownQuarantinedSet = new Set(knownQuarantinedTests.map((entry) => entry.file));

  const candidates = (report.flakyTests || [])
    .map((flakyTest) => buildCandidate(flakyTest, threshold))
    .filter((candidate) => !knownQuarantinedSet.has(candidate.file));
  const recommendedQuarantine = candidates.filter((candidate) => candidate.attempts >= threshold);

  const quarantineReport = {
    generatedAt: new Date().toISOString(),
    threshold,
    knownQuarantinedTests,
    excludedThisRun: report.scope?.excludedQuarantinedTests || [],
    flakyCandidates: candidates,
    recommendedQuarantine,
  };

  fs.writeFileSync(
    path.join(args.outputDir, "flaky-quarantine-report.json"),
    `${JSON.stringify(quarantineReport, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(args.outputDir, "flaky-quarantine-candidates.txt"),
    `${recommendedQuarantine.map((candidate) => candidate.file).join("\n")}${
      recommendedQuarantine.length ? "\n" : ""
    }`,
  );

  console.log(`Known quarantined tests: ${knownQuarantinedTests.length}`);
  console.log(`Flaky tests detected this run: ${(report.flakyTests || []).length}`);
  console.log(`New quarantine candidates: ${recommendedQuarantine.length}`);

  if (recommendedQuarantine.length > 0) {
    console.log("Recommended quarantine entries:");
    for (const candidate of recommendedQuarantine) {
      console.log(`- ${candidate.file} :: ${candidate.reason}`);
    }
  }
}

try {
  main();
} catch (error) {
  console.error(`Failed to evaluate flaky quarantine: ${error.message}`);
  process.exit(1);
}
