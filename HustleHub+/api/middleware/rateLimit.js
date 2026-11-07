const Redis = require('ioredis');   // (Frontend Highlights, 2024)

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');  // (Frontend Highlights, 2024)

// Rate limiter using Redis
// name keeps each limiter's counter separate
const rateLimiter = (limit = 100, windowTime = 15, name = 'api') => { // Default: 100 requests per 15 minutes
    return async (req, res, next) => {
        const ip = req.ip;
        const currentTime = Date.now();
        const key = `rate-limit:${name}:${ip}`;

        const wt = windowTime * 60; // 15 minutes in seconds

        const requests = await redis.incr(key);

        if (requests === 1) {
            // Set the expiration of the key to the time window on first request
            await redis.expire(key, wt);
        }

        if (requests > limit) {
            return res.status(429).json({ message: 'Too many requests, try again later.' });
        }

        next();
    };
};

// Get the current request count for a specific IP address
const getRequestCount = async (ip) => {
    const key = `rate-limit:login:${ip}`;
    const count = await redis.get(key);
    return count ? Number.parseInt(count, 10) : 0; // Number.parseInt over the global parseInt ~> (SonarSource, n.d.; MDN Web Docs, n.d.)
};

// Get the remaining time until the rate limit resets for a specific IP address
const getResetTime = async (ip) => {
    const key = `rate-limit:login:${ip}`;
    const ttl = await redis.ttl(key);
    return ttl; // Time in seconds until the rate limit resets
};

module.exports = { rateLimiter, getRequestCount, getResetTime };

//  Frontend Highlights (2024). Creating a simple API rate limiter with NodeJs. [online] Medium.
//  Available at: https://medium.com/@ignatovich.dm/creating-a-simple-api-rate-limiter-with-node-a834d03bad7a [Accessed 5 Oct. 2026].

// MDN Web Docs. n.d. Number.parseInt(). [online]. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt. [Accessed 7 November 2026]
// SonarSource. n.d. Number static methods and properties should be preferred over global equivalents (javascript:S7773). [online]. Available at: https://sonarcloud.io/organizations/sonarsource/rules?open=javascript%3AS7773&rule_key=javascript%3AS7773. [Accessed 7 November 2026]
