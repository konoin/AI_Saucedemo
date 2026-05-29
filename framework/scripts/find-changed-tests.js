const fs = require("fs");
const { execFileSync } = require("child_process");

const DEFAULT_TEST_GLOBS = [
  "tests/**/*.spec.ts",
  "tests/**/*.test.ts",
  // This repository keeps Playwright tests under framework/tests.
  "framework/tests/**/*.spec.ts",
  "framework/tests/**/*.test.ts",
];

function parseArgs(argv) {
  const args = {
    base: process.env.BASE_SHA || process.env.GITHUB_EVENT_BEFORE || "",
    head: process.env.HEAD_SHA || process.env.GITHUB_SHA || "HEAD",
    output: process.env.CHANGED_TESTS_FILE || "changed-tests.txt",
    githubOutput: false,
    patterns: (process.env.TEST_FILE_GLOBS || DEFAULT_TEST_GLOBS.join(","))
      .split(",")
      .map((pattern) => pattern.trim())
      .filter(Boolean),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--base") {
      args.base = argv[index + 1];
      index += 1;
    } else if (arg === "--head") {
      args.head = argv[index + 1];
      index += 1;
    } else if (arg === "--output") {
      args.output = argv[index + 1];
      index += 1;
    } else if (arg === "--github-output") {
      args.githubOutput = true;
    } else if (arg === "--patterns") {
      args.patterns = argv[index + 1]
        .split(",")
        .map((pattern) => pattern.trim())
        .filter(Boolean);
      index += 1;
    }
  }

  return args;
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function isAllZeroSha(value) {
  return /^0+$/.test(value || "");
}

function commitExists(ref) {
  if (!ref || isAllZeroSha(ref)) {
    return false;
  }

  try {
    runGit(["rev-parse", "--verify", `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function resolveBase(base, head) {
  if (commitExists(base)) {
    return base;
  }

  try {
    return runGit(["rev-parse", `${head}^`]);
  } catch {
    return "";
  }
}

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegExp(pattern) {
  let source = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];

    if (char === "*" && next === "*") {
      const afterGlobstar = pattern[index + 2];

      if (afterGlobstar === "/") {
        source += "(?:.*\\/)?";
        index += 2;
      } else {
        source += ".*";
        index += 1;
      }
    } else if (char === "*") {
      source += "[^/]*";
    } else {
      source += escapeRegExp(char);
    }
  }

  source += "$";
  return new RegExp(source);
}

function parseNameStatus(output) {
  if (!output) {
    return [];
  }

  const tokens = output.split("\0").filter(Boolean);
  const files = [];

  for (let index = 0; index < tokens.length; ) {
    const status = tokens[index];
    index += 1;

    if (!status) {
      continue;
    }

    if (status.startsWith("R")) {
      index += 1; // Old renamed path.
      files.push(tokens[index]);
      index += 1;
    } else {
      files.push(tokens[index]);
      index += 1;
    }
  }

  return files.map((file) => file.replace(/\\/g, "/"));
}

function writeGitHubOutput(changedTests, outputPath) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const output = [
    `has_changed_tests=${changedTests.length > 0}`,
    `changed_tests_count=${changedTests.length}`,
    `changed_tests_file=${outputPath}`,
    "changed_tests<<EOF",
    changedTests.join("\n"),
    "EOF",
  ].join("\n");

  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = resolveBase(args.base, args.head);

  if (!base) {
    throw new Error(`Unable to resolve a base commit for ${args.head}.`);
  }

  const diffOutput = execFileSync(
    "git",
    ["diff", "--name-status", "-z", "--diff-filter=AMR", base, args.head],
    { encoding: "utf8" },
  );
  const matchers = args.patterns.map(globToRegExp);
  const changedTests = Array.from(
    new Set(
      parseNameStatus(diffOutput).filter((file) =>
        matchers.some((matcher) => matcher.test(file)),
      ),
    ),
  ).sort();

  fs.writeFileSync(
    args.output,
    changedTests.length > 0 ? `${changedTests.join("\n")}\n` : "",
  );

  writeGitHubOutput(changedTests, args.output);

  console.error(`Base commit: ${base}`);
  console.error(`Head commit: ${args.head}`);
  console.error(`Changed Playwright tests: ${changedTests.length}`);
  changedTests.forEach((test) => console.log(test));
}

try {
  main();
} catch (error) {
  console.error("Failed to detect changed Playwright tests.");
  console.error(error.message);
  process.exit(1);
}
