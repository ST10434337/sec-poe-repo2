const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { ROLES, PUBLIC_ROLES } = require('../utils/roles');
const { stripTags } = require('../utils/sanitize');

// Check that a request field is a non-empty string (rejects objects such as { "$ne": null })
const isFilledString = (value) => typeof value === 'string' && value.trim() !== '';

// Generate JWT token ~> (The IIE, 2026)
const generateToken = (userId, role) =>
    jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Function to test password strength using regex ~> (GeeksforGeeks, 2026)
const testPassStrength = (password) => {
    let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
};

// Function to test email format using regex ~> (GeeksforGeeks, 2026)
const testEmailFormat = (email) => {
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// Name is Normalized by stripping HTML tags and trimming whitespace
// Email is normalized by converting to lowercase and trimming whitespace.
// Password is validated for strength using regex.
// Role is optional and defaults to 'client'. Role Can be updated later by an admin user.

// Register route handler function ~> (The IIE, 2026)
const registerUser = async (req, res) => {
    try {
        // Validate input (req.body may be undefined when no JSON body is sent)
        const { email, password, name, role } = req.body || {};
        if (![email, password, name].every(isFilledString))
            return res.status(400).json({ message: 'Email, password and name are required' });

        // Only client and freelancer can self-register; admins are never created here
        if (role !== undefined && !PUBLIC_ROLES.includes(role))
            return res.status(400).json({ message: 'Role must be client or freelancer' });

        // Strip HTML tags from the display name; it must still have text left afterwards
        let normalizedName = stripTags(name).trim();
        if (!normalizedName || normalizedName.length > 100)
            return res.status(400).json({ message: 'Name must be 1 to 100 characters of text' });

        let normalizedEmail = email.toLowerCase().trim(); // Normalize email by converting to lowercase and trimming whitespace
        // Check email format
        if (!testEmailFormat(normalizedEmail))
            return res.status(400).json({ message: 'Invalid email format' });

        // Check password strength
        if (!testPassStrength(password))
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character' });

        // Check if user already exists
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) return res.status(409).json({ message: 'Email already in use' });

        // Create new user and generate token
        const user = await User.create({ email: normalizedEmail, password, name: normalizedName, role: role ?? ROLES.CLIENT });
        const token = generateToken(user._id, user.role);
        // Send response with token and user info (excluding password)
        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (err) {

        // Handle duplicate email from the unique index (~> two registrations at the same time)
        if (err.code === 11000)
            return res.status(409).json({ message: 'Email already in use' });

        // Handle Mongoose validation errors
        if (err instanceof mongoose.Error.ValidationError) {
            const errors = Object.values(err.errors).map(
                error => error.message
            );

            return res.status(400).json({
                message: 'Validation error'
                // errors
            });
        }

        // Handle other errors
        if (process.env.NODE_ENV === 'Dev')
            console.error(err);

        res.status(500).json({
            message: 'Server error'
        });
    };
};

    // Login route handler function ~> (The IIE, 2026)
    const loginUser = async (req, res) => {
        try {
            // Validate input (must be strings, so operator objects like { "$ne": null } are rejected)
            const { email, password } = req.body || {};
            if (!isFilledString(email) || !isFilledString(password)) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            // Check if user exists and password matches
            const user = await User.findOne({ email: email.toLowerCase().trim() });
            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            // Disabled accounts cannot log in (checked after the password, so it does not reveal which accounts exist)
            if (user.isActive === false) {
                return res.status(403).json({ message: 'Account is disabled' });
            }
            // Generate token and send response
            const token = generateToken(user._id, user.role);
            res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
        } catch (err) {
            // Handle errors
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    };

    // Get current user route handler function
    const getCurrentUser = async (req, res) => {
        try {
            // Fetch user data without password
            const user = await User.findById(req.userId).select('-password');

            // Token is valid but the account no longer exists
            if (!user) return res.status(404).json({ message: 'User not found' });

            res.json({ name: user.name, email: user.email, role: user.role });
        } catch (err) {
            // Handle errors
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    };

    const becomeFreelancer = async (req, res) => {
        try {
            const user = await User.findById(req.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (user.role === 'freelancer') {
                return res.json({
                    token: generateToken(user._id, user.role),
                    user: { id: user._id, email: user.email, name: user.name, role: user.role }
                });
            }
            if (user.role !== 'client') {
                return res.status(409).json({ message: 'Only client accounts can become freelancers' });
            }

            user.role = 'freelancer';
            await user.save();

            res.json({
                token: generateToken(user._id, user.role),
                user: { id: user._id, email: user.email, name: user.name, role: user.role }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    };

    const updateUserRole = async (req, res) => {
        const { userId } = req.params;
        const { role } = req.body || {};

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        if (!['freelancer', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Role must be freelancer or admin' });
        }

        try {
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            user.role = role;
            await user.save();

            res.json({
                user: { id: user._id, email: user.email, name: user.name, role: user.role }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    };

    module.exports = {
        generateToken,
        testEmailFormat, // also used by scripts/createAdmin.js
        testPassStrength, // and this ^
        registerUser,
        loginUser,
        getCurrentUser,
        becomeFreelancer,
        updateUserRole
    };

// GeeksforGeeks (2026) JavaScript - Validate Password in JS.
//  Available at: https://www.geeksforgeeks.org/javascript/javascript-program-to-validate-password-using-regular-expressions/ (Accessed: 7 September 2026).
// GeeksforGeeks (2026) How to Validate Email Address using RegExp in JavaScript.
//  Available at: https://www.geeksforgeeks.org/javascript/how-to-validate-email-address-using-regexp-in-javascript/ (Accessed: 7 September 2026).
