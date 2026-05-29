const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const TEST_FILE_PATTERN = /^framework\/tests\/.*\.(spec|test)\.ts$/;
const DEFAULT_OUTPUT_DIR = "regression-artifacts";
const IMPACT_MAP_PATH = "framework/regression/impact-map.json";
const QUARANTINE_PATH = "framework/regression/flaky-quarantine.json";

function parseArgs(argv) {
  const args = {
    base: process.env.BASE_SHA,
    head: process.env.HEAD_SHA || "HEAD",
    outputDir: process.env.REGRESSION_ARTIFACT_DIR || DEFAULT_OUTPUT_DIR,
    full: process.env.FULL_REGRESSION === "true",
    includeQuarantined: process.env.INCLUDE_QUARANTINED === "true",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--base") {
      args.base = argv[++index];
    } else if (arg === "--head") {
      args.head = argv[++index];
    } else if (arg === "--output-dir") {
      args.outputDir = argv[++index];
    } else if (arg === "--full") {
      args.full = true;
    } else if (arg === "--include-quarantined") {
      args.includeQuarantined = true;
    }
  }

  return args;
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf-8" }).trim();
}

function isAllZeroSha(sha = "") {
  return /^0+$/.test(sha);
}

function isTestFile(filePath) {
  return TEST_FILE_PATTERN.test(normalizePath(filePath));
}

function listAllTests(startDir = "framework/tests") {
  if (!fs.existsSync(startDir)) {
    return [];
  }

  const tests = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(startDir, entry.name);

    if (entry.isDirectory()) {
      tests.push(...listAllTests(entryPath));
    } else if (isTestFile(entryPath)) {
      tests.push(normalizePath(entryPath));
    }
  }

  return tests.sort();
}

function getFallbackBase(head) {
  try {
    return runGit(["rev-parse", `${head}~1`]);
  } catch (_error) {
    return runGit(["rev-list", "--max-parents=0", head]).split("\n")[0];
  }
}

function getChangedFiles(base, head) {
  const effectiveHead = head || "HEAD";
  const effectiveBase = !base || isAllZeroSha(base) ? getFallbackBase(effectiveHead) : base;

  const diffOutput = runGit([
    "diff",
    "--name-status",
    "--find-renames",
    effectiveBase,
    effectiveHead,
  ]);

  if (!diffOutput) {
    return { base: effectiveBase, head: effectiveHead, files: [] };
  }

  const files = diffOutput
    .split("\n")
    .map((line) => {
      const [status, firstPath, secondPath] = line.split(/\t+/);
      const filePath = status.startsWith("R") || status.startsWith("C") ? secondPath : firstPath;

      return {
        status,
        path: normalizePath(filePath),
        previousPath: secondPath ? normalizePath(firstPath) : undefined,
      };
    })
    .filter((change) => Boolean(change.path));

  return { base: effectiveBase, head: effectiveHead, files };
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    throw new Error(`Unable to parse ${filePath}: ${error.message}`);
  }
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

function pathMatchesPattern(filePath, pattern) {
  return globToRegExp(pattern).test(normalizePath(filePath));
}

function getImpactMappings() {
  const impactMap = readJsonIfExists(IMPACT_MAP_PATH, { mappings: [] });

  if (Array.isArray(impactMap)) {
    return impactMap;
  }

  if (Array.isArray(impactMap.mappings)) {
    return impactMap.mappings;
  }

  return Object.entries(impactMap).map(([area, value]) => ({
    area,
    changedFiles: value.changedFiles || value.files || [],
    tests: value.tests || [],
    tags: value.tags || [],
    risk: value.risk,
  }));
}

function getImpactedAreas(changedFiles) {
  const mappings = getImpactMappings();
  const impacted = [];
  const impactedTests = new Set();

  for (const mapping of mappings) {
    const changedPatterns = mapping.changedFiles || mapping.files || [];
    const matchedFiles = changedFiles
      .map((change) => change.path)
      .filter((filePath) =>
        changedPatterns.some((pattern) => pathMatchesPattern(filePath, pattern)),
      );

    if (matchedFiles.length === 0) {
      continue;
    }

    for (const test of mapping.tests || []) {
      impactedTests.add(normalizePath(test));
    }

    impacted.push({
      area: mapping.area || mapping.name || "unmapped",
      risk: mapping.risk || "medium",
      tags: mapping.tags || [],
      matchedFiles,
      tests: (mapping.tests || []).map(normalizePath),
    });
  }

  return {
    impacted,
    impactedTests: [...impactedTests].filter(isTestFile).sort(),
  };
}

function getActiveQuarantinedTests() {
  const quarantine = readJsonIfExists(QUARANTINE_PATH, { quarantinedTests: [] });
  const entries = Array.isArray(quarantine) ? quarantine : quarantine.quarantinedTests || [];
  const today = new Date().toISOString().slice(0, 10);

  return entries
    .filter((entry) => entry && entry.active !== false)
    .filter((entry) => !entry.expiresOn || entry.expiresOn >= today)
    .map((entry) => ({
      file: normalizePath(entry.file || entry.test || ""),
      reason: entry.reason || "Repeated flaky behavior",
      ticket: entry.ticket || "",
      expiresOn: entry.expiresOn || "",
    }))
    .filter((entry) => isTestFile(entry.file));
}

function writeLines(filePath, values) {
  fs.writeFileSync(filePath, `${values.join("\n")}${values.length ? "\n" : ""}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(args.outputDir, { recursive: true });

  const changedData = args.full
    ? { base: args.base || "", head: args.head || "HEAD", files: [] }
    : getChangedFiles(args.base, args.head);

  const changedFiles = changedData.files;
  const changedTests = args.full
    ? listAllTests()
    : changedFiles
        .filter((change) => change.status !== "D")
        .map((change) => change.path)
        .filter(isTestFile)
        .sort();

  const { impacted, impactedTests } = getImpactedAreas(changedFiles);
  const selectedTests = [...new Set(args.full ? listAllTests() : [...changedTests, ...impactedTests])]
    .filter((test) => fs.existsSync(test))
    .sort();

  const activeQuarantine = getActiveQuarantinedTests();
  const quarantinedSet = new Set(activeQuarantine.map((entry) => entry.file));
  const runnableTests = args.includeQuarantined
    ? selectedTests
    : selectedTests.filter((test) => !quarantinedSet.has(test));
  const excludedQuarantinedTests = selectedTests.filter((test) => quarantinedSet.has(test));

  const scope = {
    generatedAt: new Date().toISOString(),
    baseSha: changedData.base,
    headSha: changedData.head,
    fullRegression: args.full,
    testPatterns: ["framework/tests/**/*.spec.ts", "framework/tests/**/*.test.ts"],
    changedFiles,
    changedTests,
    impactedAreas: impacted,
    impactedTests,
    quarantinedTests: activeQuarantine,
    excludedQuarantinedTests,
    selectedTests: runnableTests,
    selectedCount: runnableTests.length,
  };

  writeLines(path.join(args.outputDir, "changed-tests.txt"), changedTests);
  writeLines(path.join(args.outputDir, "impacted-tests.txt"), impactedTests);
  writeLines(path.join(args.outputDir, "selected-tests.txt"), runnableTests);
  writeLines(path.join(args.outputDir, "excluded-quarantined-tests.txt"), excludedQuarantinedTests);
  writeLines(path.join(args.outputDir, "playwright-args.txt"), runnableTests);
  fs.writeFileSync(
    path.join(args.outputDir, "regression-scope.json"),
    `${JSON.stringify(scope, null, 2)}\n`,
  );

  console.log(`Changed Playwright tests: ${changedTests.length}`);
  console.log(`Impacted tests from mapping: ${impactedTests.length}`);
  console.log(`Quarantined tests excluded: ${excludedQuarantinedTests.length}`);
  console.log(`Selected tests for execution: ${runnableTests.length}`);

  if (runnableTests.length > 0) {
    console.log(runnableTests.map((test) => `- ${test}`).join("\n"));
  }
}

try {
  main();
} catch (error) {
  console.error(`Failed to detect regression scope: ${error.message}`);
  process.exit(1);
}