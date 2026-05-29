const { execSync } = require('child_process');

try {
  // Get changed files between previous and current commit
  const changedFiles = execSync(
    'git diff --name-only HEAD~1 HEAD',
    { encoding: 'utf-8' }
  )
    .split('\n')
    .map(file => file.trim())
    .filter(Boolean);

  // Filter Playwright test files
  const changedTests = changedFiles.filter(file =>
    file.match(/^tests\/.*\.(spec|test)\.(js|ts)$/)
  );

  // Print only impacted tests
  changedTests.forEach(test => console.log(test));

} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}