# SonarQube Analysis

## Remediation and Package Updates

The primary corrective actions taken following the SonarQube static code analysis involved updating project dependencies to address known vulnerabilities and other issues identified in the analysis report.

Packages were reviewed and updated to newer, more secure versions where applicable. This included updating packages with known security vulnerabilities, addressing outdated dependencies, and reducing potential risks associated with using older package versions.

Additionally, dependencies that were not directly implemented or explicitly managed within the project were updated through their parent packages. This was achieved by allowing newer dependency versions to be resolved through package updates and dependency overrides where necessary.

These changes were made to improve the overall security, stability, and maintainability of the HustleHub+ application while reducing the number of known issues identified by SonarQube.

Following the updates, the static code analysis was executed again to evaluate the effectiveness of the changes and identify any remaining issues requiring attention.

### Dependency Security Fixes

- **jsdom / Undici:** Updated jsdom to resolve a vulnerable Undici dependency that could cause the Node.js process to crash when handling malformed HTTP responses.
- **Minimatch:** Verified that the installed version (`11.0.5`) already contained the fix for a ReDoS vulnerability involving malicious glob patterns.
- **Uri-js:** The uri-js was found to be unmaintained as such was overridden with fast-uri which is a modern drop in replacement

### Unresolved / Monitored Security Findings

- **Faker:** Identified a vulnerable transitive dependency used by Newman. An attempted upgrade caused compatibility issues, so the override was reverted pending an upstream Newman update.
- **Picomatch:** Identified a potential ReDoS vulnerability in a transitive dependency. No changes were made pending a suitable upstream fix.
- **Braces:** Reviewed a reported stack overflow vulnerability in recursive brace pattern processing. The advisory was withdrawn, so no dependency changes were made.
- **file-type:** Identified a reported infinite-loop vulnerability involving malformed MKV files. The installed version (`3.9.0`) falls outside the affected version range, so no update was necessary.


## Additional Security Features

To improve the security of the HustleHub+ application, two additional security features were implemented. These features provide extra protection against unauthorized access and help ensure that user sessions are properly controlled. Both features are integrated into the existing MERN-stack authentication system.

### 1. Account Lockout After Failed Login Attempts

An account lockout mechanism was implemented to protect user accounts against brute-force password attacks. A brute-force attack occurs when an attacker repeatedly attempts to log in using different password combinations until the correct password is found.

The system monitors the number of consecutive failed login attempts for each user. After **five unsuccessful login attempts**, the user's account is temporarily locked for **15 minutes**. During this period, the user is prevented from logging in, even if further login attempts are made.

To support this functionality, two additional fields are maintained in the User model:

- `loginAttempts`: Tracks the number of consecutive unsuccessful login attempts.
- `lockUntil`: Stores the date and time when the temporary account lockout expires.

Seen in `api/models/User.js`.
```js
  loginAttempts: { 
    type: Number, 
    default: 0 
  },

  lockUntil: { 
    type: Date, 
    default: null
  }  
```

When a login attempt fails because of an incorrect password, the failed attempt counter is incremented. Once the maximum number of attempts is reached, the system sets the account's lockout expiry time. When the lockout period has passed, the user can attempt to log in again.

Seen in `api/controllers/authController.js` Lines 115 - 127.
```js
    // Check if the account is locked due to multiple failed login attempts
    if(user.lockUntil > Date.now()) {
        return res.status(403).json({ message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' });
    }

    // Check if password matches
    if (!(await user.comparePassword(password))) {
        user.loginAttempts = user.loginAttempts + 1; // Increment failed login attempts
        if(user.loginAttempts >= 5) { // Lock account after 5 failed attempts
            user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
        }
        await user.save(); // Save the updated user document
        return res.status(401).json({ message: 'Invalid credentials' });
    }
```

If the user successfully logs in, the failed login counter is reset and the lockout information is cleared.

Seen in `api/controllers/authController.js` Lines 136 - 137.
```js
    user.loginAttempts = 0; // Reset failed login attempts on successful login
    await user.save(); // Save the updated user document
```

**Security benefit:** This feature reduces the risk of brute-force attacks by limiting the number of password guesses an attacker can make within a short period. It adds an additional layer of protection to user accounts without permanently preventing legitimate users from accessing their accounts.

### 2. JWT Token Revocation on Logout

A JWT token revocation mechanism was implemented to improve session security and ensure that users can properly terminate their authenticated sessions.

By default, JSON Web Tokens (JWTs) remain valid until they expire. This means that simply logging out of the frontend application does not automatically invalidate the token on the server. If a token is stolen or copied before its expiry, it could potentially still be used to access protected endpoints.

To address this issue, HustleHub+ maintains a collection of revoked JWT tokens in the MongoDB database. When a user logs out, the application adds the token to this collection so that it can no longer be used to authenticate requests.

```js
    // authController ln 234 - 238
    // Revoke token using the model
    await RevokedToken.revokeToken(
        req.token,
        new Date(decoded.exp * 1000)
    );
```

For security reasons, the application does not store the original JWT token. Instead, it uses the SHA-256 hashing algorithm to generate a hash of the token. Only this hash is stored in the database.

Seen in `api/models/RevokedToken.js` ln 27 - 34 
```js
// Revoke a JWT token
revokedTokenSchema.statics.revokeToken = async function(token, expiresAt) {
    const tokenHash = this.hashToken(token);

    return await this.create({
        tokenHash,
        expiresAt
    });
};
```

The implementation is separated according to the application's MVC structure:

- **RevokedToken Model:** Handles token hashing, storing revoked tokens, and checking whether a token has been revoked.
- **Authentication Middleware:** Verifies the JWT and checks the database to determine whether the token has been revoked before allowing access to protected routes.
- **Logout Controller:** Handles logout requests and adds the authenticated user's token to the revoked-token collection.
- **Authentication Routes:** Expose the logout endpoint, protected by the authentication middleware.

Each revoked token is stored with its original expiry date. MongoDB's TTL (Time To Live) index automatically removes expired token records from the collection. The middleware also checks the token's expiry when validating requests.

When a request is made to a protected endpoint, the middleware first verifies the JWT signature and expiry. It then checks whether the token's hash exists in the revoked-token collection. If the token has been revoked, the request is rejected with an HTTP `401 Unauthorized` response.

Seen in `api/middleware/auth.js` ln 26 - 30
```js
    const revoked = await RevokedToken.isRevoked(token);
    if (revoked) {
      res.status(401).json({ message: 'Session Expired. Please log in again.' });
      return false;
    }
```

**Security benefit:** This feature allows the server to invalidate a user's JWT session immediately after a successful logout request, rather than relying only on the token's original expiry time. It reduces the risk of unauthorized access through previously issued tokens and provides better control over authenticated sessions.

### Conclusion

The two additional security features strengthen the authentication and session-management processes within HustleHub+. The account lockout mechanism helps protect user accounts against repeated password-guessing attempts, while JWT token revocation ensures that logged-out sessions cannot continue accessing protected resources.

Together, these features provide additional protection beyond the application's existing authentication controls and contribute to a more secure freelance marketplace.