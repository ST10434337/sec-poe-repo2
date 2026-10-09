const mongoose = require('mongoose');

// Final error handler: log the real error, but send only safe messages to the client
const errorhandler = (err, req, res, next) => {
    console.error(err.message);

    // The JSON body was invalid or too large for Express to parse
    if (err.type === 'entity.parse.failed')
        return res.status(400).json({ message: 'Invalid JSON body' });
    if (err.type === 'entity.too.large')
        return res.status(413).json({ message: 'Request body too large' });

    // Database validation or invalid id 
    if (err instanceof mongoose.Error.ValidationError)
        return res.status(400).json({ message: 'Validation error' });
    if (err instanceof mongoose.Error.CastError)
        return res.status(400).json({ message: 'Invalid id' });

    // Anything else unexpected remains hidden behind generic msg
    res.status(500).json({ message: 'Server error' });
};

module.exports = errorhandler;