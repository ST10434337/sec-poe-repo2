const jwt = require('jsonwebtoken'); //(The IIE, 2026)
const User = require('../models/User');

// RBAC (IIE, 2026)
function authenticateRequest(req, res) {

  // Check for the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No Token Provided' });
    return false;
  }

  //  Extract the token from the header
  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Invalid token provided' });
    return false;
  }

  // Verify the token and extract the payload
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    req.userId = payload.userId;
    return true;
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return false;
  }
}

function requireAuth(req, res, next) {
  if (authenticateRequest(req, res)) next();
}

const authorisedRoles = (...allowedRoles) => async (req, res, next) => {
  if (!authenticateRequest(req, res)) return;

  try {
    const user = await User.findById(req.userId).select('role');
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access Denied' });
    }
    req.user.role = user.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth, authorisedRoles };

//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): 
//  Module manual. The Independent Institute of Education (Pty) Ltd.  No newline at end of file