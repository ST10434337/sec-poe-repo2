
// Get current User Id for Logging
exports.userId = (req, res, next) => {
    req.userId = req.userId || "User not logged in"; // Default value if userId is not set
    next();
};  