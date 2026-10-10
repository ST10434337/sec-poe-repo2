// Create a new admin account from .env values.
// Run this from the api folder with: npm run create-admin
// Required .env values: ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Same DNS servers as index.js, so the mongodb+srv address resolves the same way
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES } = require('../utils/roles');
const { testEmailFormat, testPassStrength } = require('../controllers/authController');

const createAdmin = async () => { // (The IIE, 2026)
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, MONGO_URI } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME)
        throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME in .env');

    // Reuse the same email and password checks as registration
    const email = ADMIN_EMAIL.toLowerCase().trim();
    if (!testEmailFormat(email))
        throw new Error('ADMIN_EMAIL is not a valid email address');
    if (!testPassStrength(ADMIN_PASSWORD))
        throw new Error('ADMIN_PASSWORD must be at least 8 characters and include uppercase, lowercase, number and special character');

    await mongoose.connect(MONGO_URI);

    // The admin email must be new; cannot promote existing members
    const existing = await User.findOne({ email });
    if (existing) { 
        throw new Error('A user with ADMIN_EMAIL already exists. Use a new admin email.');
    }

    // User.js hashes the password before saving
    await User.create({
        email,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME.trim(),
        role: ROLES.ADMIN
    });

    console.log(`Created admin ${email}`);
};

// The password is never printed, even when something goes wrong
createAdmin()
    .catch((err) => {
        console.error(`create-admin failed: ${err.message}`);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());


// for package.json
// npm. n.d. scripts. [online] Available at: https://docs.npmjs.com/cli/v11/using-npm/scripts (Accessed: 9 October 2026).    
//The Independent Institute of Education (IIE). 2026. Information Systems 3D (INSY7314/w): Module manual. The Independent Institute of Education (Pty) Ltd.