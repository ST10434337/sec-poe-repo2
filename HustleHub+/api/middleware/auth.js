const jwt = require('jsonwebtoken'); //(The IIE, 2026)
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');

// RBAC (IIE, 2026)
async function authenticateRequest(req, res) {

  // Check for the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No Token Provided' });
    return false;
  }

  // Verify the token and extract the payload
  try {
      //  Extract the token from the header
    const token = authHeader.split(' ')[1] || null;
    if (!token) {
      res.status(401).json({ message: 'Invalid token provided' });
      return false;
    }

    

    const revoked = await RevokedToken.isRevoked(token);
    if (revoked) {
      res.status(401).json({ message: 'Session Expired. Please log in again.' });
      return false;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.userId || !payload.role) {
      res.status(401).json({ message: 'Invalid token payload' });
      return false;
    }

    req.user = payload;
    req.userId = String(payload.userId); // Ensure userId is a string for consistent comparisons and SonarQube analysis
    req.userRole = String(payload.role); // Same as above
    console.log(`Authenticated user: ${req.userId} with role: ${req.userRole}`); // Debugging log
    req.token = token; // Store the token for potential revocation checks
    return true;
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return false;
  }
}

// Load the logged-in user from the database on every protected request, so a deleted
// or disabled account is blocked straight away, even while its token has not expired
// Returns the user, or null after sending the error response (OWASP. n.d)
async function loadActiveUser(req, res) {
  const user = await User.findById(req.userId).select('role isActive');
  if (!user) {
    res.status(401).json({ message: 'User not found' });
    return null;
  }
  if (user.isActive === false) {
    res.status(403).json({ message: 'Account is disabled' });
    return null;
  }

  // Use the role from the database, not the token, in case an admin changed it
  req.user.role = user.role;
  req.userRole = user.role;
  return user;
}

// Any logged-in, active user
const requireAuth = async (req, res, next) => {
  if (!(await authenticateRequest(req, res))) return;

  try {
    if (await loadActiveUser(req, res)) next();
  } catch (err) {
    next(err);
  }
};

// Logged-in, active user with one of the allowed roles
const allowRoles = (...allowedRoles) => async (req, res, next) => {
  if (!(await authenticateRequest(req, res))) return;

  try {
    const user = await loadActiveUser(req, res);
    if (!user) return;
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth, allowRoles };

//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w):
//  Module manual. The Independent Institute of Education (Pty) Ltd.
// OWASP. n.d. Authorization Cheat Sheet: Validate the Permissions on Every Request. [online] Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html#validate-the-permissions-on-every-request (Accessed: 11 October 2026).
