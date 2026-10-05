// Error handling middleware
const errorhandler = (err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: 'Oopsie Daisy There was an error' });
};

module.exports = errorhandler;