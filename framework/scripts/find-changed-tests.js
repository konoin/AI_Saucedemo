const fs = require("fs");
const { execFileSync } = require("child_process");

const changedTestsPath = "changed-tests.txt";
const changedTestsJsonPath = "changed-tests.json";
const inScopeTestPattern = /^framework\/tests\/.*\.(spec|test)\.ts$/;

function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function getDiffArgs() {
  const args = process.argv.slice(2).filter(Boolean);

  if (args.length > 0) {
    return args;
  }

  if (process.env.GITHUB_BASE_SHA && process.env.GITHUB_SHA) {
    return [`${process.env.GITHUB_BASE_SHA}...${process.env.GITHUB_SHA}`];
  }

  return ["HEAD~1", "HEAD"];
}

function parseChangedTests(diffOutput) {
  const changes = {
    added: [],
    modified: [],
  };

  for (const line of diffOutput.split("\n").filter(Boolean)) {
    const [status, firstPath, secondPath] = line.split("\t");
    const filePath = normalizePath(status.startsWith("R") || status.startsWith("C") ? secondPath : firstPath);

    if (!inScopeTestPattern.test(filePath)) {
      continue;
    }

    if (status.startsWith("A")) {
      changes.added.push(filePath);
      continue;
    }

    if (status.startsWith("M") || status.startsWith("R") || status.startsWith("C")) {
      changes.modified.push(filePath);
    }
  }

  return {
    added: [...new Set(changes.added)].sort(),
    modified: [...new Set(changes.modified)].sort(),
  };
}

try {
  const diffArgs = getDiffArgs();
  const diffOutput = execFileSync("git", ["diff", "--name-status", ...diffArgs], {
    encoding: "utf-8",
  });
  const changedTests = parseChangedTests(diffOutput);
  const allChangedTests = [...changedTests.added, ...changedTests.modified];

  fs.writeFileSync(changedTestsPath, allChangedTests.join("\n") + (allChangedTests.length > 0 ? "\n" : ""));
  fs.writeFileSync(
    changedTestsJsonPath,
    `${JSON.stringify(
      {
        ...changedTests,
        all: allChangedTests,
        range: diffArgs.join(" "),
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )}\n`
  );

  console.log("Added tests:");
  changedTests.added.forEach((test) => console.log(`- ${test}`));
  if (changedTests.added.length === 0) {
    console.log("- None detected");
  }

  console.log("\nModified tests:");
  changedTests.modified.forEach((test) => console.log(`- ${test}`));
  if (changedTests.modified.length === 0) {
    console.log("- None detected");
  }
} catch (error) {
  console.error("Failed to detect changed Playwright tests.");
  console.error(error.message);

  process.exit(1);
}