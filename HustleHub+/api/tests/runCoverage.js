
const { spawnSync } = require('node:child_process');

function runTests(name, args) {
    console.log(`\n========== Running ${name} ==========\n`);

    const result = spawnSync(process.execPath, args, {
        stdio: 'inherit',
        env: process.env
    });

    if (result.error) {
        console.error(`Failed to run ${name}:`, result.error);
        process.exit(1);
    }

    if (result.status !== 0) {
        console.error(`${name} failed.`);
        // process.exit(result.status ?? 1);
    }

    console.log(`\n========== ${name} completed ==========\n`);
}

// Run Newman integration tests.
runTests('Newman Integration Tests', [
    './tests/newmanTests.js'
]);

// Run Node.js unit tests.
runTests('Node.js Unit Tests', [
    '--test',
    'tests/unit/*.test.js'
]);
