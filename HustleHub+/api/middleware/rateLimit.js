const Redis = require('ioredis');   // (Frontend Highlights, 2024)

const redis = new Redis();  // (Frontend Highlights, 2024)

// Rate limiter using Redis
const rateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const currentTime = Date.now();
  const key = `rate-limit:${ip}`;

  const limit = 100; // Max requests
  const windowTime = 15 * 60; // 15 minutes in seconds

  const requests = await redis.incr(key);

  if (requests === 1) {
    // Set the expiration of the key to the time window on first request
    await redis.expire(key, windowTime);
  }

  if (requests > limit) {
    return res.status(429).json({ message: 'Too many requests, try again later.' });
  }

  next();
};

module.exports = rateLimiter;

//  Frontend Highlights (2024). Creating a simple API rate limiter with NodeJs. [online] Medium. 
//  Available at: https://medium.com/@ignatovich.dm/creating-a-simple-api-rate-limiter-with-node-a834d03bad7a [Accessed 5 Oct. 2026].