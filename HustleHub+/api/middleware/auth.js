const jwt = require('jsonwebtoken'); //(The IIE, 2026)

// Middleware to require authentication for protected routes 
function requireAuth(req, res, next) {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization;

  // Make Sure Auth Token is provided
  if(!authHeader || !authHeader.startsWith('Bearer ')){
    return res.status(401).json({message: 'No Token Provided'})
  }

  // Split Provided Token
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  // If no token is provided, return a 401 Unauthorized response
  if (!token) return res.status(401).json({ message: 'Invalid token provided' });

  // Verify the token using the secret key and extract the user ID
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};


// RBAC (IIE, 2026)
const authorisedRoles = (...allowedRoles) => {
    return (req, res, next) => {
        requireAuth(req, res, () => {
            if (!req.user || !allowedRoles.includes(req.user.role)){
                return res.status(403).json({message: 'Access Denied'});
            }
            next();
    });
  };
};


module.exports = {requireAuth, authorisedRoles};
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w): 
//  Module manual. The Independent Institute of Education (Pty) Ltd. 