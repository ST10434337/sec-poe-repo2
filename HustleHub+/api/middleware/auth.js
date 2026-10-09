const jwt = require('jsonwebtoken'); //(The IIE, 2026)
const User = require('../models/User');

// Middleware to require authentication for protected routes
async function requireAuth(req, res, next) {
  // Get the token from the Authorization header, which must be "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.slice(7);

  // Verify the JWT and decode its payload so we can read the user id
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Use the user id from the token to load the current account role and status
  // thus, disabled accounts are blocked immediately
  const user = await User.findById(payload.userId).select('role isActive');
  if (!user) return res.status(401).json({ message: 'Invalid or expired token' });
  if (user.isActive === false) return res.status(403).json({ message: 'Account is disabled' });

  req.userId = user.id;
  req.userRole = user.role;
  next();
};

module.exports = requireAuth;
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w):
//  Module manual. The Independent Institute of Education (Pty) Ltd.
