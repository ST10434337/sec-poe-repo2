// Stop NoSQL injection by blocking bad keys in the request body ~> (OWASP, n.d.)
// Bad keys can start with $ ~> $gt or has a dot ~> a.b
// This only checks the body and leaves the req.query alone

// Used bodies never this deep, so it blocks deeper bodies
const MAX_DEPTH = 10;

// True if has $ or .
const isDangerousKey = (key) => key.startsWith('$') || key.includes('.');

// Look through every object & list in the body for a bad key
const hasDangerousKey = (value, depth = 0) => {
    // Text, numbers & null have no keys so are safe
    if (value === null || typeof value !== 'object') return false;
    // Too deep = unsafe
    if (depth > MAX_DEPTH) return true;

    // Check each item if in a list
    if (Array.isArray(value)) {
        for (const item of value) {
            if (hasDangerousKey(item, depth + 1)) return true;
        }
        return false;
    }

    // An object: check each key, then look inside that key's value
    for (const key of Object.keys(value)) {
        if (isDangerousKey(key)) return true;
        if (hasDangerousKey(value[key], depth + 1)) return true;
    }
    return false;
};

// Send back 400 if the body has a bad key, else continue
const sanitizeBody = (req, res, next) => {
    if (hasDangerousKey(req.body))
        return res.status(400).json({ message: 'Invalid request body' });
    next();
};

module.exports = sanitizeBody;

// OWASP. n.d. NoSQL Security Cheat Sheet: Prevent NoSQL Injection. [online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/NoSQL_Security_Cheat_Sheet.html#prevent-nosql-injection (Accessed: 11 October 2026).