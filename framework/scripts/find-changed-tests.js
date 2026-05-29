const fs = require("fs");
const { execFileSync } = require("child_process");
const {
  isPlaywrightTest,
  loadJson,
  matchesAnyPattern,
  normalizePath,
  unique,
  writeJson,
  writeLines,
} = require("./regression-utils");

const IMPACT_MAP_PATH = "framework/config/impact-map.json";

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function resolveDiffRange() {
  const eventName = process.env.GITHUB_EVENT_NAME || "local";
  const head = getArg("--head") || process.env.HEAD_SHA || process.env.GITHUB_SHA || "HEAD";
  const before = getArg("--before") || process.env.BEFORE_SHA || process.env.GITHUB_EVENT_BEFORE;
  const base =
    getArg("--base") ||
    process.env.BASE_SHA ||
    process.env.GITHUB_BASE_SHA ||
    process.env.GITHUB_BASE_REF;

  if (eventName === "pull_request" && base) {
    const baseRef = base.match(/^[0-9a-f]{7,40}$/) ? base : `origin/${base}`;
    return { args: ["diff", "--name-status", `${baseRef}...${head}`], base: baseRef, head };
  }

  if (before && !/^0+$/.test(before)) {
    return { args: ["diff", "--name-status", before, head], base: before, head };
  }

  if (base) {
    return { args: ["diff", "--name-status", `${base}...${head}`], base, head };
  }

  return { args: ["diff", "--name-status", "HEAD~1", head], base: "HEAD~1", head };
}

function parseNameStatus(output) {
  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, firstPath, secondPath] = line.split("\t");
      const file = normalizePath(secondPath || firstPath);
      return { status, file };
    })
    .filter(({ status }) => !status.startsWith("D"));
}

function getImpactedTests(changedFiles) {
  const impactMap = loadJson(IMPACT_MAP_PATH, { mappings: [] });
  const mappings = Array.isArray(impactMap.mappings) ? impactMap.mappings : [];
  const impactedTests = [];
  const impactedAreas = [];

  for (const mapping of mappings) {
    const sources = mapping.source || mapping.sources || [];
    const tests = mapping.tests || [];

    if (matchesAnyPatternForAnyFile(changedFiles, sources)) {
      impactedTests.push(...tests.map(normalizePath).filter(isPlaywrightTest));
      if (mapping.area) {
        impactedAreas.push(mapping.area);
      }
    }
  }

  return {
    dependencyMappingFound: mappings.length > 0,
    impactedAreas: unique(impactedAreas),
    impactedTests: unique(impactedTests).filter((testPath) => fs.existsSync(testPath)),
  };
}

function matchesAnyPatternForAnyFile(files, patterns) {
  return files.some((file) => matchesAnyPattern(file, patterns));
}

function writeGithubOutputs(plan) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const output = [
    `has_tests=${plan.selectedTests.length > 0}`,
    `test_count=${plan.selectedTests.length}`,
    "selected_tests<<EOF",
    plan.selectedTests.join("\n"),
    "EOF",
  ].join("\n");

  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
}

try {
  const range = resolveDiffRange();
  const diffOutput = git(range.args);
  const changedEntries = parseNameStatus(diffOutput);
  const changedFiles = changedEntries.map(({ file }) => file);
  const changedTests = changedEntries.filter(({ file }) => isPlaywrightTest(file));
  const addedTests = changedTests
    .filter(({ status }) => status.startsWith("A"))
    .map(({ file }) => file);
  const modifiedTests = changedTests
    .filter(({ status }) => !status.startsWith("A"))
    .map(({ file }) => file);
  const impacted = getImpactedTests(changedFiles);
  const selectedTests = unique([...changedTests.map(({ file }) => file), ...impacted.impactedTests]);

  const plan = {
    generatedAt: new Date().toISOString(),
    eventName: process.env.GITHUB_EVENT_NAME || "local",
    base: range.base,
    head: range.head,
    fullRegression: false,
    changedFiles,
    changedTests: changedTests.map(({ file }) => file),
    addedTests,
    modifiedTests,
    impactedTests: impacted.impactedTests,
    impactedAreas: impacted.impactedAreas,
    dependencyMappingFound: impacted.dependencyMappingFound,
    selectedTests,
  };

  writeLines("changed-tests.txt", plan.changedTests);
  writeLines("impacted-tests.txt", plan.impactedTests);
  writeJson("regression-plan.json", plan);
  writeGithubOutputs(plan);

  for (const testPath of selectedTests) {
    console.log(testPath);
  }
} catch (error) {
  console.error("Failed to detect changed or impacted Playwright tests.");
  console.error(error.message);
  process.exit(1);
}