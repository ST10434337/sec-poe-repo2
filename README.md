# HustleHub+ – Part 1: Secure Foundations

## Project Overview

HustleHub+ is a secure freelance marketplace platform designed to connect freelancers with clients. The complete system will allow freelancers to advertise services, clients to browse and book those services, and the platform to record booking-related transactions so that freelancers can monitor income and estimated tax obligations.

This repository contains
Part 1 – Secure Foundations of the HustleHub+ POE. The purpose of Part 1 is to establish the secure backend foundation on which the later full-stack marketplace will be built. The current implementation focuses on a Node.js and Express REST API, MongoDB persistence, user registration and login, password hashing, JSON Web Token (JWT) authentication, protected routes, HTTPS support, input checks, security headers, controlled CORS access, and secure error responses.
Security is treated as a core architectural requirement because HustleHub+ will ultimately process credentials, booking information, transaction records, and income-related data.



Part 1 implements the foundational backend and authentication layer. The current system provides:

- A Node.js and Express backend API
- MongoDB connectivity through Mongoose
- User registration
- User login
- Password hashing with bcrypt
- JWT generation and verification
- A protected current-user endpoint
- Basic role storage for `user`, `seller`, and `admin`
- HTTP security headers through Helmet
- Content Security Policy configuration
- Restricted Cross-Origin Resource Sharing (CORS)
- JSON request parsing
- Local HTTPS support using an SSL certificate
- Controlled error responses
- Health monitoring for the API and MongoDB connection
- Postman requests for HTTP and HTTPS API testing

Marketplace features such as gig management, booking, transaction recording, freelancer income tracking, and the React frontend are developed in later parts of the POE.



## Intended Users

The complete HustleHub+ system is designed around three user categories:

| User | Intended responsibility |
| --- | --- |
| Client/User | Browse available services and make bookings |
| Freelancer/Seller | Create and manage services and later view bookings and income |
| Administrator | Administrative and platform-management functions |

In Part 1, roles are stored as part of the user record and included in the JWT payload. Full role-based authorisation is expanded in later stages of the project.

## System Architecture

┌─────────────────────────────┐
│       React Frontend        │
│      (Part 2 onwards)       │
└──────────────┬──────────────┘
               │ HTTPS / JSON
               ▼
┌─────────────────────────────┐
│     Node.js + Express API   │
│                             │
│  Routes                     │
│  Authentication Middleware  │
│  Security Middleware        │
│  Error Handling             │
└──────────────┬──────────────┘
               │ Mongoose
               ▼
┌─────────────────────────────┐
│           MongoDB           │
│       User persistence      │
└─────────────────────────────┘

The frontend and backend form separate system boundaries. The client communicates with the Express API using HTTP/HTTPS requests and JSON. The API is responsible for authentication, validation, security controls, application logic, and access to MongoDB. The browser/client is therefore not permitted to access the database directly.

The repository also contains the supplied architecture and authentication-flow diagram:

![HustleHub+ System Architecture and Authentication Flow](../INSY7314_SysArch%26AuthFlow.png)

## Authentication Flow

```text
Registration
Client
  ↓
POST /api/auth/register
  ↓
Validate required data
  ↓
Check whether email already exists
  ↓
Hash password with bcrypt
  ↓
Store user in MongoDB
  ↓
Generate JWT
  ↓
Return token + safe user information

Login
Client
  ↓
POST /api/auth/login
  ↓
Find user by email
  ↓
Compare supplied password with stored hash
  ↓
Generate JWT if credentials are valid
  ↓
Return token + safe user information

Protected Request
Client
  ↓
Authorization: Bearer <JWT>
  ↓
Authentication middleware
  ↓
jwt.verify(...)
  ↓
Extract authenticated user ID
  ↓
Protected route
```

## Backend Structure

```text
HustleHub+/
├── .postman/
│   └── resources.yaml
├── config/
│   └── db.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── models/
│   └── User.js
├── postman/
│   ├── collections/
│   │   ├── http/
│   │   └── https/
│   ├── environments/
│   └── globals/
├── index.js
├── make-certs.js
├── package.json
├── package-lock.json
└── Readme.md
```
## Main Components

index.js
Creates and configures the Express application, applies security middleware, connects to MongoDB, registers API routes, configures HTTP/HTTPS, exposes health information, and handles undefined routes.

config/db.js
Creates the MongoDB connection using Mongoose and the database URL supplied through the environment configuration.

models/User.js 
Defines the user schema and role options. It also hashes passwords before they are persisted and provides a method for comparing a supplied password with its stored hash.

routes/auth.js 
Contains registration, login, JWT creation, and the protected `/me` route.

middleware/auth.js 
Extracts a Bearer token from the `Authorization` header and verifies it before allowing access to a protected route.

middleware/errorHandler.js 
Returns a generic server-error response rather than exposing internal application information to the client.

make-certs.js
Generates a self-signed certificate and private key for local HTTPS development using OpenSSL.



## Technology Stack

| Technology | Purpose |
| --- | --- |
| Node.js | JavaScript runtime for the backend |
| Express | REST API and routing framework |
| MongoDB | Persistent data storage |
| Mongoose | MongoDB object modelling and schema management |
| bcrypt | Secure password hashing |
| jsonwebtoken | JWT creation and verification |
| Helmet | Security-related HTTP response headers |
| CORS | Restricts which frontend origin may access the API |
| dotenv | Loads sensitive/configurable values from environment variables |
| HTTPS | Encrypts traffic between the client and API |
| Nodemon | Restarts the development server when files change |
| Postman | API request and response testing |


## Security Design

### Password Hashing

Passwords must never be stored as plain text. If a database containing plain-text passwords were exposed, an attacker would immediately gain access to every stored credential.

HustleHub+ uses **bcrypt** to hash passwords before they are written to MongoDB. The `User` model contains a Mongoose pre-save hook that hashes a modified password using a work factor of **12 salt rounds**:

```javascript
this.password = await bcrypt.hash(this.password, 12);
```

During login, the submitted password is not decrypted because password hashes are one-way values. Instead, `bcrypt.compare()` checks the submitted password against the stored hash:

```javascript
return bcrypt.compare(candidate, this.password);
```

The API therefore does not need to retain or return a user's original password.



### JSON Web Token Authentication

HustleHub+ uses JSON Web Tokens to identify authenticated users after registration or login.

A token is signed using the server-side `JWT_SECRET` and contains the user's ID and role:

```javascript
jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);
```

Token expiration is configured through an environment variable. Expiring tokens reduce the period for which a stolen or previously issued token can remain useful.

For a protected request, the client supplies the token in the HTTP header:

```text
Authorization: Bearer <token>
```

The authentication middleware extracts the Bearer token and verifies its signature and expiry using `jwt.verify()`. If verification succeeds, the authenticated user's ID is added to the request before control passes to the protected route. Missing, invalid, or expired tokens receive an HTTP `401 Unauthorized` response.

This approach prevents a client from gaining access to a protected endpoint simply by supplying a user ID in the request.



### Protected Routes

The current protected endpoint is:

```text
GET /api/auth/me
```

It uses the authentication middleware before retrieving the current user. The password field is explicitly excluded from the database result:

```javascript
User.findById(req.userId).select('-password');
```

This reduces the risk of a password hash being exposed unnecessarily through an API response.



### Input Validation

The API performs server-side checks before processing authentication requests.

Registration requires:

- Email
- Password
- Name
- Role

Login requires:

- Email
- Password

Requests with missing required fields receive an HTTP `400 Bad Request` response. Mongoose also enforces schema-level rules, including required user fields, a unique email address, trimming/lowercasing of email values, and an enumerated role.

The current Part 1 implementation therefore provides foundational validation. More extensive sanitisation and field-level validation are part of the expanded security work required in later POE stages.


### HTTPS

Credentials and JWTs are sensitive information. If they are transmitted over unencrypted HTTP on an untrusted network, traffic may potentially be intercepted.

HustleHub+ therefore supports HTTPS for local development. When:

```env
USE_HTTPS=true
```

the application creates an HTTPS server using the configured certificate and private-key paths.

The `make-certs.js` utility creates a self-signed RSA certificate for `localhost` using OpenSSL. These certificates are intended for **development only**, not for production deployment.

HTTPS provides encryption in transit and helps protect the confidentiality and integrity of communication between the client and backend.



### Helmet and Security Headers

The application uses Helmet to apply security-related HTTP response headers.

A Content Security Policy is configured with restrictions including:

- Resources default to the same origin.
- Scripts are limited to the same origin.
- Styles are limited to the same origin.
- Object embedding is disabled.
- Framing is disabled through `frame-ancestors`.
- Connection sources are restricted.
- Base URLs are restricted.

The Express `X-Powered-By` header is also disabled:

```javascript
app.disable('x-powered-by');
```

Removing this header reduces unnecessary disclosure about the technology used by the server.



Cross-Origin Resource Sharing is restricted to the configured frontend origin:

```env
CLIENT_ORIGIN=http://localhost:5173
```

The application currently permits only `GET` and `POST` cross-origin methods and the `Content-Type` and `Authorization` headers.

This is safer than permitting unrestricted cross-origin access because only the expected client origin is authorised by the API's CORS configuration.



### Environment Variables and Secret Management

Configuration values are loaded with `dotenv` rather than being hard-coded into the application.

A local `.env` file should contain values similar to:

```env
PORT=4000
DATABASE_URL=mongodb://127.0.0.1:27017/hustlehub
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
CLIENT_ORIGIN=http://localhost:5173
USE_HTTPS=false
NODE_ENV=Dev
APP_NAME=HustleHub+
ENVIROMENT=Development
```

When HTTPS is enabled, the following may optionally be supplied:

```env
SSL_KEY_PATH=./certs/localhost-key.pem
SSL_CERT_PATH=./certs/localhost-cert.pem
```

> Never commit real secrets, private keys, passwords, or production connection strings to GitHub.



### Secure Error Handling

Error responses should provide enough information for the client to understand that a request failed without revealing sensitive implementation details.

The application uses controlled responses such as:

```json
{
  "message": "Invalid credentials"
}
```

and generic server-error responses rather than returning stack traces, local file paths, configuration values, database credentials, or JWT secrets to the client.

Unknown routes return:

```json
{
  "error": "Route not found"
}
```

with HTTP status `404`.

This reduces information leakage that could otherwise help an attacker understand the internal structure of the application.



### Database Security

MongoDB is accessed through Mongoose and the connection string is supplied through `DATABASE_URL`.

The user schema applies several controls:

- `email` is required and unique.
- Email values are converted to lowercase and trimmed.
- `password` is required.
- `name` is required.
- `role` is limited to `user`, `seller`, or `admin`.
- Passwords are hashed before storage.
- Passwords are excluded from the `/me` API response.

The application also terminates during startup if the MongoDB connection cannot be established, preventing the API from continuing in an unexpected database state.



## Installation and Setup

### Prerequisites

Before running HustleHub+, install:

- Node.js
- npm
- MongoDB
- OpenSSL if local HTTPS certificates are required
- Postman for API testing

Verify Node.js and npm:

```bash
node --version
npm --version
```

MongoDB must be running and accessible through the value configured in `DATABASE_URL`.


### 1. Clone the Repository

```bash
git clone https://github.com/ST10443441/INSY7314_Poe_Part1.git
cd INSY7314_Poe_Part1/HustleHub+
```


### 2. Install Dependencies

```bash
npm install
```


### 3. Configure the Environment

Create a `.env` file inside the `HustleHub+` directory and configure the required values.

Example:

```env
PORT=4000
DATABASE_URL=mongodb://127.0.0.1:27017/hustlehub
JWT_SECRET=your_private_secret
JWT_EXPIRES_IN=1h
CLIENT_ORIGIN=http://localhost:5173
USE_HTTPS=false
```

Do not upload the `.env` file to a public repository.



### 4. Generate Local HTTPS Certificates

For HTTPS development:

```bash
npm run mkcert
```

This creates:

```text
certs/localhost-key.pem
certs/localhost-cert.pem
```

The certificate-generation script is intended only for the local development environment.

Then set:

```env
USE_HTTPS=true
```

### 5. Run the Application

Normal start:

```bash
npm start
```

The current `start` script launches:

```text
index.js
```

### Development Script Note

The repository currently defines:

```json
"dev": "nodemon server.js"
```

but the actual application entry point is `index.js`. Before using `npm run dev`, update the script in `package.json` to:

```json
"dev": "nodemon index.js"
```

Then development mode can be started with:

```bash
npm run dev
```



## API Reference

The examples below assume port `4000`.

When HTTP is enabled:

```text
http://localhost:4000
```

When HTTPS is enabled:

```text
https://localhost:4000
```

### POST `/api/auth/register`

Creates a new user account and returns a JWT.

#### Request

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "Example User",
  "role": "user"
}
```

The current schema accepts the following roles:

```text
user
seller
admin
```

#### Successful Response — `201 Created`

```json
{
  "token": "<JWT>",
  "user": {
    "id": "<MongoDB user ID>",
    "email": "user@example.com",
    "name": "Example User",
    "role": "user"
  }
}
```

#### Possible Errors

| Status | Meaning |
| --- | --- |
| `400` | Required registration information is missing |
| `400` | Email is already in use |
| `500` | Server error |



### POST `/api/auth/login`

Authenticates an existing user.

#### Request

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Successful Response — `200 OK`

```json
{
  "token": "<JWT>",
  "user": {
    "id": "<MongoDB user ID>",
    "email": "user@example.com",
    "name": "Example User",
    "role": "user"
  }
}
```

#### Possible Errors

| Status | Meaning |
| --- | --- |
| `400` | Email or password is missing |
| `401` | Invalid credentials |
| `500` | Server error |



### GET `/api/auth/me`

Returns information about the currently authenticated user.

#### Authentication

Include the JWT returned by registration/login:

```text
Authorization: Bearer <JWT>
```

#### Successful Response — `200 OK`

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "role": "user"
}
```

#### Authentication Errors

```json
{
  "message": "No token provided"
}
```

or:

```json
{
  "message": "Invalid or expired token"
}
```

Both return HTTP status `401`.



## GET `/`

Confirms that the HustleHub+ API is responding.

### Response

```json
{
  "message": "Welcome to the HustleHub+ API"
}
```



### GET `/health`

Reports API and MongoDB health.

A healthy database connection returns HTTP `200`. A degraded database connection returns HTTP `503`.

Example:

```json
{
  "Api": "Running on Port 4000",
  "MongoDb": {
    "status": "ok",
    "timestamp": "2026-09-06T00:00:00.000Z",
    "services": {
      "database": {
        "status": "connected",
        "isHealthy": true
      }
    }
  }
}
```



### GET `/system-info`

This endpoint is registered only when:

```env
NODE_ENV=Dev
```

It returns development environment information configured through environment variables.

It should not be treated as a public production endpoint because environment and system information should be disclosed only when required.



## API Testing with Postman

The repository contains Postman resources for both HTTP and HTTPS testing.

```text
postman/
├── collections/
│   ├── http/
│   └── https/
├── environments/
└── globals/
```

The supplied requests cover:

- Registration
- Login
- Current authenticated user
- API root
- Health endpoint
- Failed/undefined URL behaviour

### Recommended Test Sequence

1. Start MongoDB.
2. Start the HustleHub+ API.
3. Send a valid registration request.
4. Confirm a `201` response and JWT are returned.
5. Confirm that the password stored in MongoDB is hashed rather than plain text.
6. Send a valid login request.
7. Confirm a JWT and safe user object are returned.
8. Use the token in `Authorization: Bearer <token>`.
9. Request `/api/auth/me`.
10. Confirm the authenticated user's details are returned without a password.
11. Repeat `/api/auth/me` without a token and confirm `401`.
12. Test an invalid token and confirm `401`.
13. Test incorrect login credentials and confirm `401`.
14. Test missing registration/login fields and confirm `400`.
15. Request an undefined URL and confirm `404`.
16. Request `/health` and verify the API/database status.
17. Repeat the relevant tests over HTTPS when `USE_HTTPS=true`.

Screenshots of the important successful and failed API responses should be retained as submission evidence.



## Security Test Scenarios

| Scenario | Expected Result |
| --- | --- |
| Register with valid required data | User created; password hashed; JWT returned |
| Register with missing fields | `400 Bad Request` |
| Register an existing email | Request rejected |
| Login with correct credentials | `200 OK` and JWT returned |
| Login with incorrect password | `401 Unauthorized` |
| Access `/me` without token | `401 Unauthorized` |
| Access `/me` with invalid/expired token | `401 Unauthorized` |
| Access `/me` with valid token | Authenticated user returned |
| Inspect `/me` response | Password/hash is not exposed |
| Request unknown route | `404 Route not found` |
| MongoDB unavailable | Health check becomes degraded/unavailable |
| HTTPS enabled | API communicates using local TLS certificate |



## Key Security Decisions

The Part 1 backend was designed around the following decisions:

1. Passwords are hashed rather than encrypted or stored in plain text.Bcrypt provides one-way password protection and a configurable work factor.
2. JWTs are used for authenticated requests.The server verifies the signed token instead of trusting user-supplied identity information.
3. Protected routes require authentication middleware.This centralises token verification and prevents unauthenticated access.
4. Secrets and environment-specific settings are externalised.Values such as the database URL and JWT secret are obtained from environment variables.
5. HTTPS is supported.Authentication data can be encrypted in transit.
6. CORS is restricted.The API does not intentionally allow arbitrary browser origins.
7. Helmet adds defensive HTTP headers.The configured CSP and related headers reduce exposure to common browser-based attacks.
8. Technology disclosure is reduced.Express's `X-Powered-By` response header is disabled.
9. Error information returned to clients is controlled.Internal stack traces, paths, secrets, and configuration values are not intentionally included in API error responses.
10.Sensitive user data is minimised in responses.Passwords are not returned by authentication responses or the protected current-user endpoint.


# Current Part 1 Limitations and Planned Progression

Part 1 intentionally establishes the secure backend foundation rather than the entire marketplace.

The following capabilities form part of later POE development:

- React frontend
- Full role-based access control
- Freelancer gig creation and management
- Client gig browsing
- Booking creation
- Simulated booking/payment confirmation
- Transaction records
- Freelancer income tracking
- Tax estimation and financial dashboard
- Expanded validation and sanitisation
- Rate limiting
- Backend and frontend automated testing
- Newman execution
- CI/CD using GitHub Actions
- Static code/security analysis
- Docker and Docker Compose
- Expanded application logging and monitoring
- Additional security controls
- Final security review

This incremental approach allows the security foundation created in Part 1 to be refined and extended as the system develops.


**YouTube Video:** 
`Add final video link here`


## Authors

**Student Numbers:** ST10443441, ST10294763, ST10434337 
**Project:** HustleHub+


[Readme for the Api](HustleHub+/Readme.md)
