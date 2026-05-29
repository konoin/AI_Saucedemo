const { loadJson } = require("./regression-utils");

const report = loadJson("framework/reports/regression-report.json", null);
const metadata = loadJson("framework/reports/run-metadata.json", { exitCode: 0 });

if (!report) {
  console.error("Regression report was not generated.");
  process.exit(1);
}

if (report.status === "FAILED" || metadata.exitCode > 0) {
  console.error("Regression failures were detected. Failing workflow after reporting completed.");
  process.exit(1);
}

console.log(`Regression gate passed with status: ${report.status}`);
