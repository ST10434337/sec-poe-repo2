require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');




const app = express();


// .env variables
const PORT = process.env.PORT || 4000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Disable the 'X-Powered-By' header for security reasons
app.disable('x-powered-by');

// Use Helmet to define HTTP headers for security
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

// Enable CORS for the specified client origin
app.use(
    cors({
        origin: CLIENT_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

app.use(express.json()); 

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Db Congfig
const connectDB = require('./config/db');
connectDB();
// Routes
const authRoutes = require('./routes/auth');

// Error handling middleware
app.use(errorHandler);
// Auth handling middleware
app.use('/api/auth', authRoutes);

// Start the server based on the USE_HTTPS environment variable
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

// Base Defined Routes

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the HustleHub+ API' });
});

app.get('/system-info', (req, res) => {
    res.json({
        app: process.env.APP_NAME,
        enviroment: process.env.ENVIROMENT
    });
});

// Health Endpoint
app.get('/health', (req, res) => {
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
        uptime: process.uptime(),
        services: {
            database: {
                status: mongoStates[dbState],
                isHealthy: isHealthy
            }
        }
    }});
});

// Send a response with a 404 status code for any undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
})