const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env.test') });
console.log('🔄 Loaded variables from .env.test');

const newman = require('newman');
const mongoose = require('mongoose');
const createAdmin = require('../scripts/createAdmin');
const PORT = process.env.PORT || 4000;

async function runNewmanTests() {
    let server;
    let exitCode = 0;

    try {
        console.log('🔧 Creating admin user for tests...');
        await createAdmin({ allowExisting: true });
        console.log('✅ Admin user ready.');

        // Wait for admin setup before importing the app or starting Newman.
        const app = require('../index.js');
        server = app.listen(PORT);
        await new Promise((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });

        console.log(`🚀 API Server booted in TEST mode on http://localhost:${PORT}`);
        console.log('🤖 Starting Newman automation tests...');

        const summary = await new Promise((resolve, reject) => {
            newman.run({
                collection: require('./collection.json'),
                environment: require('./environment.json'),
                insecure: true,
                reporters: 'cli'
            }, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        if (summary.run.failures.length) {
            console.error('❌ Tests failed!');
            exitCode = 1;
        } else {
            console.log('✅ All tests passed successfully!');
        }
    } catch (err) {
        console.error(`❌ Newman test setup or execution failed: ${err.message}`);
        exitCode = 1;
    } finally {
        if (server) {
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

        try {
            await dropMongoCollections();
            console.log('🗑️ Test database cleaned up.');
        } catch (err) {
            console.error(`⚠️ Failed to clean up test database: ${err.message}`);
            exitCode = 1;
        }
    }

    process.exitCode = exitCode;
}

async function dropMongoCollections() {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Refusing to drop the database unless NODE_ENV is test');
    }
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured');
    }
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
}

runNewmanTests();
