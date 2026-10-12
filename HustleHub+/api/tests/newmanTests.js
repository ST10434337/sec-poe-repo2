const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env.test') });
console.log('🔄 Loaded variables from .env.test');

const newman = require('newman');
const mongoose = require('mongoose');
const createAdmin = require('../scripts/createAdmin');  // Import the createAdmin function from the scripts directory
const PORT = process.env.PORT || 4000;

async function runNewmanTests() {
    let server;
    let exitCode = 0;

    try {
        console.log('🔧 Creating admin user for tests...');
        await createAdmin({ allowExisting: true });     // Create an admin user before running tests, allowing existing users to remain unchanged
        console.log('✅ Admin user ready.');

        // Wait for admin setup before importing the app or starting Newman.
        const app = require('../index.js');
        server = app.listen(PORT);                      // Start the server to run tests against it
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });                                             // Wait for the server to start listening before proceeding with tests

        console.log(`🚀 API Server booted in TEST mode on http://localhost:${PORT}`);
        console.log('🤖 Starting Newman automation tests...');

        const summary = await new Promise((resolve, reject) => {    // Run Newman tests using the specified collection and environment files
            newman.run({
                collection: require('./collection.json'),
                environment: require('./environment.json'),
                insecure: true,
                reporters: 'cli'
            }, (err, result) => {
                if (err) {
                    reject(err);                        // Reject the promise if there's an error running the tests
                } else {
                    resolve(result);                    // Resolve the promise with the test results if successful
                }
            });
        });

        if (summary.run.failures.length) {              // Check if there are any test failures in the summary
            console.error('❌ Tests failed!');
            exitCode = 1;
        } else {                                        // If all tests pass, log a success message
            console.log('✅ All tests passed successfully!');
        }
    } catch (err) {
        console.error(`❌ Newman test setup or execution failed: ${err.message}`);      // Log any errors that occur during the setup or execution of the tests
        exitCode = 1;
    } finally {
        if (server) {                                   // If the server was started, attempt to close it gracefully
            try {
                await new Promise((resolve, reject) => {
                    server.close((err) => err ? reject(err) : resolve());
                });
                console.log('👋 Test server closed.');
            } catch (err) {
                console.error(`⚠️ Failed to close test server: ${err.message}`);
                exitCode = 1;
            }
        }

        try {                                           // Clean up the test database by dropping all collections after tests have run
            await dropMongoCollections();
            console.log('🗑️ Test database cleaned up.');
        } catch (err) {
            console.error(`⚠️ Failed to clean up test database: ${err.message}`);
            exitCode = 1;
        }
    }

    process.exitCode = exitCode;                        // Set the process exit code based on test results and cleanup success
}

async function dropMongoCollections() {                 //  Function to drop all collections in the MongoDB database, used for cleaning up after tests
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Refusing to drop the database unless NODE_ENV is test');
    }
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured'); // Ensure that the MongoDB URI is set in the environment variables before attempting to connect
    }
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);  // Connect to the MongoDB database if not already connected
    }
    await mongoose.connection.dropDatabase();           // Drop the entire test database to ensure a clean state for future tests
    await mongoose.disconnect();                        // Disconnect from the database after dropping it to free up resources
}

runNewmanTests();                                       // Execute the function to run Newman tests and handle setup, execution, and cleanup
