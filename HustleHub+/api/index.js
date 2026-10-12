const express = require('express');
const path = require('path');
const fs = require('fs');

const dotenv = require('dotenv');

const normalizedNodeEnv = (process.env.NODE_ENV || 'Prod').trim().toLowerCase();
process.env.NODE_ENV = normalizedNodeEnv;
const envFile = path.resolve(process.cwd(), `.env.${normalizedNodeEnv}`);
const baseEnvFile = path.resolve(process.cwd(), '.env');

if (fs.existsSync(baseEnvFile)) {
    dotenv.config({ path: baseEnvFile });
}
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: true });
}

const isTestMode = process.env.NODE_ENV === 'test';
const isDevMode = process.env.NODE_ENV === 'dev';


const cors = require('cors');
const helmet = require('helmet');
const https = require('https');
const mongoose = require('mongoose');

const rateLimit = require("./middleware/rateLimit");

const app = express();

// Set DNS servers to Google's public DNS servers for reliable name resolution
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
// .env variables
const PORT = process.env.PORT || 4000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Disable the 'X-Powered-By' header for security reasons
app.disable('x-powered-by');

// Use Helmet to define HTTP headers for security ~> (The IIE, 2026)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'"],
                imgSrc: ["'self'", "'data:'"],
                connectSrc: ["'self'", CLIENT_ORIGIN],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                frameAncestors: ["'none'"],
            }
        },
        crossOriginResourcePolicy: { policy: "same-site" },
    })
);

// Enable CORS for the specified client origin ~> (The IIE, 2026)
app.use(
    cors({
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],  // PATCH is used by the booking status routes
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Parse incoming JSON requests
app.use(express.json());

// Reject bodies with keys starting with $ or containing a dot (NoSQL injection), before any route runs
const sanitizeBody = require('./middleware/sanitizeBody');
app.use(sanitizeBody);

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Db Config
const connectDB = require('./config/db');
connectDB();
// Routes
const authRoutes = require('./routes/auth');
const gigRoutes = require('./routes/gigs');
const bookingRoutes = require('./routes/bookings');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');

// Limit Rates for /api routes using the rateLimiter middleware
// app.use('/api', rateLimit.rateLimiter(), route);

// Auth handling middleware
app.use('/api/auth', rateLimit.rateLimiter(25, 15, 'login'), authRoutes); // Apply rate limiting to auth routes

// Gig routes (login and role checks are applied inside the router)
// Rate limits applied in routes file
app.use('/api/gigs', gigRoutes);

// Booking routes (login and role checks are applied inside the router)
// Rate limits applied in routes file
app.use('/api/bookings', bookingRoutes);

// Transaction and income routes (login and role checks are applied inside the router)
// No rate limit as transactions can refresh often
app.use('/api/transactions', transactionRoutes);

// Admin routes (every route is admin only)
app.use('/api/admin', rateLimit.rateLimiter(25, 15, 'admin'), adminRoutes);


// Base Defined Routes

// Root Endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HustleHub+ API' });
});

// System Info Endpoint (available in dev/test as the collection expects) ~> (The IIE, 2026)
if (isDevMode || isTestMode) {
    app.get('/system-info', (req, res) => {
        res.json({
            app: process.env.APP_NAME || 'HustleHub+',
            environment: process.env.ENVIRONMENT || process.env.NODE_ENV,
            testing: isTestMode,
        });
    });
}
// Api Health Check Endpoint
app.get('/health', async (req, res) => {
    const mongoStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    const dbState = mongoose.connection.readyState;
    const isHealthy = dbState === 1;

    res.status(isHealthy ? 200 : 503).json(
        {
            Api: `Running on Port ${PORT}`,
            MongoDb: {
                status: isHealthy ? 'ok' : 'degraded',
                timestamp: new Date().toISOString(),
                // uptime: process.uptime(),
                services: {
                    database: {
                        status: mongoStates[dbState],
                        isHealthy: isHealthy
                    }
                }
            },
            // Get Rate Limit Info for the current IP address
            RateLimit: {
                ip: req.ip, // Current IP address making the request
                count: await rateLimit.getRequestCount(req.ip), // Current request count for the IP address
                resetTime: await rateLimit.getResetTime(req.ip) // Time in seconds until the rate limit resets for the IP address
            }
        });
});

// Send a response with a 404 status code for any undefined routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
})

// Error handling middleware
app.use(errorHandler);

// Start the server based on the USE_HTTPS environment variable ~> (The IIE, 2026)
if (require.main === module) {
    if (USE_HTTPS) {
        console.log("Starting HTTPS...");
        const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'certs', 'localhost-key.pem');
        const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'certs', 'localhost-cert.pem');

        const httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };

        https.createServer(httpsOptions, app).listen(PORT, () => {
            console.log(`Application listening on port ${PORT} (HTTPS)`);
        });
    } else {
        console.log("Starting HTTP...");
        app.listen(PORT, () => {
            console.log(`Application listening on port ${PORT}`);
            console.log(`http://localhost:4000`)
        });
    };
}

module.exports = app; // Export the app for testing purposes
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w):
//  Module manual. The Independent Institute of Education (Pty) Ltd. 