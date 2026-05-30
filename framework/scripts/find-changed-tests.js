const { execFileSync } = require("child_process");
const fs = require("fs");

const TEST_FILE_PATTERN = /^framework\/tests\/.+\.(spec|test)\.ts$/;
const diffArgs =
  process.argv.length > 2
    ? process.argv.slice(2)
    : (process.env.TEST_DIFF_RANGE || "HEAD~1 HEAD")
        .split(/\s+/)
        .filter(Boolean);

function parseNameStatusLine(line) {
  const [status, ...paths] = line.split("\t").map((value) => value.trim());
  const code = status?.[0];
  const file =
    code === "R" || code === "C" ? paths[paths.length - 1] : paths[0];

  return { code, file };
}

function uniqueSorted(files) {
  return [...new Set(files)].sort();
}

try {
  const changes = execFileSync(
    "git",
    ["diff", "--name-status", "--diff-filter=AMR", ...diffArgs],
    {
      encoding: "utf-8",
    },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseNameStatusLine)
    .filter(({ file }) => TEST_FILE_PATTERN.test(file));

  const added = uniqueSorted(
    changes.filter(({ code }) => code === "A").map(({ file }) => file),
  );
  const modified = uniqueSorted(
    changes
      .filter(({ code }) => code === "M" || code === "R")
      .map(({ file }) => file),
  );
  const all = uniqueSorted([...added, ...modified]);

  fs.writeFileSync(
    "changed-tests.txt",
    all.join("\n") + (all.length ? "\n" : ""),
    "utf-8",
  );
  fs.writeFileSync(
    "changed-tests.json",
    JSON.stringify({ added, modified, all }, null, 2),
    "utf-8",
  );

  all.forEach((test) => console.log(test));
} catch (error) {
  console.error("Failed to detect changed tests.");
  console.error(error.message);

  process.exit(1);
}
