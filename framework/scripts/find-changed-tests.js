const { execSync } = require('child_process');

try {
  const changedFiles = execSync(
    'git diff --name-only HEAD~1 HEAD',
    { encoding: 'utf-8' }
  )
    .split('\n')
    .map(file => file.trim())
    .filter(Boolean);

  const changedTests = changedFiles.filter(file =>
    file.match(/^framework\/tests\/.*\.(spec|test)\.(js|ts)$/)
  );

  changedTests.forEach(test => console.log(test));

} catch (error) {
  console.error('Failed to detect changed tests.');
  console.error(error.message);

  process.exit(1);
}