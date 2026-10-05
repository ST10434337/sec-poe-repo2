# HustleHub+ Developer Helper Methods

This guide explains the helper methods and middleware implemented in the API.
HTTP endpoints and request examples are documented in
[`api/Readme.md`](api/Readme.md).

## Redis rate limiter

`api/middleware/rateLimit.js` exports an object with three methods. Its Redis
counter approach is based on Frontend Highlights (2024):

- `rateLimiter(limit, windowTime)` returns Express middleware. `limit` is the
  number of requests allowed for a client IP during the window. `windowTime` is
  measured in minutes. Defaults are 100 requests and 15 minutes. Requests over
  the limit receive status `429` and a JSON message.
- `getRequestCount(ip)` returns a promise for the stored request count.
- `getResetTime(ip)` returns a promise for the Redis TTL in seconds. Redis
  returns `-2` if the key does not exist and `-1` if the key has no expiry.

The limiter stores a counter in Redis using the mounted base path and the
client IP. The Redis client uses `REDIS_URL`; Docker Compose sets this to
`redis://redis:6379`. Outside Compose, it defaults to
`redis://127.0.0.1:6379`, so a local Redis server must be running or
`REDIS_URL` must point to another Redis instance.

To limit the auth routes to 25 requests per IP every 15 minutes, register the
limiter before the auth router:

```js
const rateLimit = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');

app.use('/api/auth', rateLimit.rateLimiter(25, 15), authRoutes);
```

Register the returned middleware before the router it should protect, on the
same Express mount. The current `api/index.js` registers the router first, so
requests handled by that router can finish before reaching the limiter. Reverse
the registration order before relying on the configured 25-request,
15-minute policy.

### Rate limiter diagnostics and caveats

The limiter creates keys in the form
`rate-limit:<base-path>:<ip>`, but `getRequestCount(ip)` and
`getResetTime(ip)` currently look up `rate-limit:<ip>`. The diagnostic methods
therefore do not currently inspect the limiter's keys. Update them to use the
same key format before relying on their results.

The counter increment and initial expiry are separate Redis operations, so
they are not atomic. If Redis is unavailable, requests that pass through the
async limiter can fail; keep the configured Redis service reachable.

## Authentication helpers

The JWT and authentication patterns in these helpers are based on the course
module guidance (The Independent Institute of Education [IIE], 2026).

`api/middleware/auth.js` exports `requireAuth` directly. Add it before a
protected request handler. It reads the bearer token from the request,
validates it with `JWT_SECRET`, and places the token's `userId` on `req.userId`.
Missing, invalid, and expired tokens receive status `401`. The middleware checks
identity only; it does not enforce user roles.

`api/controllers/authController.js` exports the following functions:

- `generateToken(userId, role)` signs a JWT using `JWT_SECRET` and
  `JWT_EXPIRES_IN`.
- `registerUser(req, res)` validates registration data, creates the user, and
  responds with a token and safe user details.
- `loginUser(req, res)` verifies credentials and responds with a token and safe
  user details.
- `getCurrentUser(req, res)` uses `req.userId` to retrieve a profile without
  its password hash.

The three request handlers are Express controller methods wired by the route
module. The email-format and password-strength checks are internal controller
helpers and are not exported; their regular-expression validation approach
draws on GeeksforGeeks (2026a, 2026b).

## Database and password helpers

`api/config/db.js` exports `connectDB()`. It connects Mongoose using
`MONGO_URI`. If the connection fails, it logs the failure and exits the
process. The API calls this helper during startup. The user schema's bcrypt
hashing and password comparison behavior follow the module guidance (IIE,
2026).

The `User` model hashes passwords with bcrypt before saving. Its instance
method `user.comparePassword(candidate)` returns a promise that resolves to
`true` when the candidate matches the stored hash. Registration and login use
these model behaviors; application code should not return or log the hash.

## Error handler

`api/middleware/errorHandler.js` exports Express error-handling middleware.
Errors passed to it are logged and receive a generic `500` JSON response. Some
controller methods handle their own errors and return their own response
instead of passing the error to this middleware.

## References

Frontend Highlights (2024). *Creating a simple API rate limiter with NodeJs*.
[online] Medium. Available at:
https://medium.com/@ignatovich.dm/creating-a-simple-api-rate-limiter-with-node-a834d03bad7a
(Accessed: 5 October 2026).

GeeksforGeeks (2026a). *How to Validate Email Address using RegExp in
JavaScript*. Available at:
https://www.geeksforgeeks.org/javascript/how-to-validate-email-address-using-regexp-in-javascript/
(Accessed: 7 September 2026).

GeeksforGeeks (2026b). *JavaScript Program to Validate Password using Regular
Expressions*. Available at:
https://www.geeksforgeeks.org/javascript/javascript-program-to-validate-password-using-regular-expressions/
(Accessed: 7 September 2026).

The Independent Institute of Education (IIE) (2026). *Information Systems 3D
(INSY7314/w): Module manual*. The Independent Institute of Education (Pty)
Ltd.