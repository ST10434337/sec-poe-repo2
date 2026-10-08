// Middleware to allow a route only for the given roles ~> (The IIE, 2026)
// Must run after requireAuth, which sets req.userRole
const allowRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.userRole))
        return res.status(403).json({ message: 'Access denied' });
    next();
};

module.exports = { allowRoles };
//The Independent Institute of Education (IIE) (2026) Information Systems 3D (INSY7314/w):
//  Module manual. The Independent Institute of Education (Pty) Ltd.
