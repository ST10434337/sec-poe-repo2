const path = require('path');
const dotenv = require('dotenv');
const newman = require('newman');
const createAdmin = require('../scripts/createAdmin'); // Import the createAdmin function

// Force the script to read .env.test right at the beginning
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
console.log('🔄 Loaded variables from .env.test');

// Import your Express app instance (Do not call app.listen() inside your server.js file directly, or export it so we can boot it here)
// Note: Ensure your server/app file uses process.env.MONGO_URI (or similar) from your loaded dotenv config!
const app = require('../index.js'); 

const PORT = process.env.PORT || 4000;

//  Start your Express server programmatically
const server = app.listen(PORT, () => {
    console.log(`🚀 API Server safely booted in TEST mode on http://localhost:${PORT}`);
    console.log('🔧 Creating admin user for tests...');
    
    createAdmin()
        .then(() => {
            console.log('✅ Admin user created successfully.');
        })
        .catch((err) => {
            console.error('❌ Failed to create admin user:', err.message);
            process.exit(1);
        });

    console.log('🤖 Starting Newman automation tests...');

    //  Run Newman programmatically now that the server is live
    newman.run({
        collection: require('./collection.json'), // Path to your Postman collection file
        environment: require('./environment.json'), // Path to your Postman environment file
        insecure: true,
        reporters: 'cli'
    }, function (err, summary) {
        // Clean up after tests finish
        console.log('🛑 Newman execution complete. Shutting down test server...');
        
        server.close(() => {
            console.log('👋 Test server closed cleanly.');
            
            if (err || summary.run.failures.length) {
                console.error('❌ Tests failed!');
                dropMongoCollections()
                .then(() => {
                    console.log('🗑️ Test database cleaned up.');
                })
                .catch((cleanupErr) => {
                    console.error('⚠️ Failed to clean up test database:', cleanupErr.message);
                })
                .finally(() => {
                    process.exit(1); // Exits with an error code for your terminal or CI/CD
                });
            } else {
                console.log('✅ All tests passed successfully!');
                dropMongoCollections()
                .then(() => {
                    console.log('🗑️ Test database cleaned up.');
                })
                .catch((cleanupErr) => {
                    console.error('⚠️ Failed to clean up test database:', cleanupErr.message);
                })
                .finally(() => {
                    process.exit(0); // Exits cleanly
                });
            }
        });
    });
});

dropMongoCollections = async () => {
    const mongoose = require('mongoose');
    const { MONGO_URI } = process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
};