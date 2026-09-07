# 🚀 HustleHub+ API — Setup & Usage

Backend documentation for the HustleHub+ API: installation, environment variables, API reference and the Postman test sequence.

The architecture, request flow, token handling, validation and security rationale write-up lives in the root [README.md](../README.md).

---

## 📋 Prerequisites

| Requirement | Notes |
| ----------- | ----- |
| **Node.js + npm** | Verify with `node --version` and `npm --version` |
| **MongoDB** | [Community Edition](https://www.mongodb.com/products/self-managed/community-edition). Must be running before you start the API. A database named `hustlehub` is created automatically on first write. |
| **OpenSSL** | Only needed for the certificate step. `openssl` must be on your `PATH` (it ships with Git Bash on Windows). |

---

## 🔐 Environment Variables

The API is driven entirely by a `.env` file in the `HustleHub+/` folder. `.env` is **git-ignored**, so it is not in the repository — create it before the first run.

```env
APP_NAME = HustleHub+
# Controls error verbosity. Dev = verbose server-side logging.
# Swap to Prod to demonstrate that no internal detail leaks to the client.
NODE_ENV = Dev

PORT = 4000
DATABASE_URL = mongodb://127.0.0.1:27017/hustlehub

USE_HTTPS = true
CLIENT_ORIGIN = http://localhost:5173
SSL_KEY_PATH = ./certs/localhost-key.pem
SSL_CERT_PATH = ./certs/localhost-cert.pem

JWT_SECRET = <a long random string>
JWT_EXPIRES_IN = 1h
```

| Variable | Purpose | Default if unset |
| -------- | ------- | ---------------- |
| `APP_NAME` | Reported by `GET /system-info` | — |
| `NODE_ENV` | `Dev` enables verbose server-side error logging and mounts `GET /system-info` | not `Dev` (quiet) |
| `PORT` | Port the server listens on | `4000` |
| `DATABASE_URL` | Mongo connection string | — (connection fails, process exits) |
| `USE_HTTPS` | `true` starts an HTTPS server, anything else starts HTTP | HTTP |
| `CLIENT_ORIGIN` | The single origin allowed by CORS and added to the CSP `connect-src` | `http://localhost:5173` |
| `SSL_KEY_PATH` / `SSL_CERT_PATH` | Certificate paths used when `USE_HTTPS=true` | `certs/localhost-key.pem`, `certs/localhost-cert.pem` |
| `JWT_SECRET` | Signing secret for JWTs | — (token signing fails) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `1h` | — |

> ⚠️ `GET /system-info` is only registered when `NODE_ENV` is exactly `Dev`. In any other mode the route falls through to the 404 handler — that is intentional.

---

## 🆕 First-Time Setup

Generate the local development certificate before the first run:

```bash
cd HustleHub+
npm install
npm run mkcert
```

`npm run mkcert` runs [make-certs.js](make-certs.js), which shells out to **OpenSSL** to create a self-signed `localhost` certificate (RSA 2048, SHA-256, 365 days) in `certs/`. It skips generation if `certs/localhost-cert.pem` already exists — delete the `certs/` folder to force a regeneration.

***SELF-SIGNED CERTIFICATES ARE FOR DEVELOPMENT ONLY — NEVER PRODUCTION.***

Because the certificate is self-signed, Postman and browsers will warn about it. In Postman, turn **Settings → General → SSL certificate verification** *off* when testing the HTTPS collection.

---

## 💻 Running in Development Mode

```bash
cd HustleHub+
npm run dev
```

Runs the app under **nodemon**, which restarts the server automatically whenever a source file is saved.

---

## ▶️ Running the Application Normally

```bash
cd HustleHub+
npm start
```

Runs `node ./index.js` with no watcher.

On startup the console prints either `Starting HTTPS...` or `Starting HTTP...` depending on `USE_HTTPS`, followed by `MongoDB connected` and the listening port.

**Base URL:**

| `USE_HTTPS` | Base URL |
| ----------- | -------- |
| `true` | `https://localhost:4000` |
| `false` | `http://localhost:4000` |

---

## ⚡ Quick Start

### First-Time Launch

```bash
cd HustleHub+
npm install
npm run mkcert
npm run dev
```

### Development

```bash
cd HustleHub+
npm run dev
```

### Normal Launch

```bash
cd HustleHub+
npm start
```

---

## 📌 Command Reference

| Purpose                  | Command          |
| ------------------------ | ---------------- |
| 📦 Install dependencies  | `npm install`    |
| 🆕 Generate certificates | `npm run mkcert` |
| 💻 Development mode      | `npm run dev`    |
| ▶️ Normal start          | `npm start`      |


> There is no automated test suite in Part 1 — `npm test` intentionally exits with an error. Testing is done through the Postman collection below. We will implement testing in Part 2. 

---

## 🔄 Typical Workflow

If this is your **first time running the application**:

```text
1. Install dependencies
        ↓
2. Create .env
        ↓
3. Run npm run mkcert
        ↓
4. Start MongoDB
        ↓
5. Run npm run dev
        ↓
6. Application starts
```

For future development sessions:

```text
Start MongoDB → Run npm run dev → Application starts
```

For a normal application launch:

```text
Start MongoDB → Run npm start → Application starts
```

---

# 📖 API Reference

All request and response bodies are JSON. Protected routes expect an `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Purpose |
| ------ | -------- | ---- | ------- |
| `POST` | `/api/auth/register` | — | Create an account and receive a JWT |
| `POST` | `/api/auth/login` | — | Exchange credentials for a JWT |
| `GET`  | `/api/auth/me` | ✅ Bearer | Return the authenticated user's profile |
| `GET`  | `/health` | — | API + MongoDB health check |
| `GET`  | `/` | — | Root welcome message |
| `GET`  | `/system-info` | — | App/environment info (**`NODE_ENV=Dev` only**) |
| *any*  | *anything else* | — | `404 { "message": "Route not found" }` |

---

## Auth

### POST /api/auth/register

**Request Body**
```json
{
  "email": "String",
  "name": "String",
  "password": "String",
  "role": "String (user | seller | admin)"
}
```

Validation rules:
- All four fields are required.
- `email` must match the email regex and is stored lowercased and trimmed.
- `password` must be **at least 8 characters** and contain an uppercase letter, a lowercase letter, a number and one of `@ $ ! % * ? &`.
- `role` must be one of `user`, `seller`, `admin` (defaults to `user` at schema level).

**Success — 201**
```json
{
  "token": "String",
  "user": {
    "id": "userId",
    "email": "userEmail",
    "name": "userName",
    "role": "userRole"
  }
}
```

**Errors**
| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "message": "All fields are required" }` | A required field is missing |
| 400 | `{ "message": "Invalid email format" }` | Email failed the regex check |
| 400 | `{ "message": "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character" }` | Weak password |
| 400 | `{ "message": "Email already in use" }` | Duplicate email |
| 400 | `{ "message": "Validation error" }` | Mongoose schema validation failed (e.g. invalid `role`) |
| 500 | `{ "message": "Server error" }` | Unexpected server-side failure |


**Image of register**

---

### POST /api/auth/login

**Request Body**
```json
{
  "email": "String",
  "password": "String"
}
```

**Success — 200**
```json
{
  "token": "String",
  "user": {
    "id": "userId",
    "email": "userEmail",
    "name": "userName",
    "role": "userRole"
  }
}
```

**Errors**
| Status | Body | Cause |
|--------|------|-------|
| 400 | `{ "message": "Email and password are required" }` | A required field is missing |
| 401 | `{ "message": "Invalid credentials" }` | Unknown email **or** wrong password (deliberately indistinguishable) |
| 500 | `{ "message": "Server error" }` | Unexpected server-side failure |

**Image of Login**

---

### GET /api/auth/me

**Headers**
```http
Authorization: Bearer <token>
```

**Success — 200**
```json
{
  "name": "String",
  "email": "String",
  "role": "String"
}
```

The password hash is stripped server-side with `.select('-password')` and is never returned.

**Errors**
| Status | Body | Cause |
|--------|------|-------|
| 401 | `{ "message": "No token provided" }` | Missing or malformed `Authorization` header |
| 401 | `{ "message": "Invalid or expired token" }` | Bad signature or expired token |
| 404 | `{ "message": "User not found" }` | Token is valid but the account no longer exists |
| 500 | `{ "message": "Server error" }` | Unexpected server-side failure |

**Image of /me with valid token**

**Image of /me with invalid token**


---

## System

### GET /health

Returns **200** when Mongoose reports a live connection, **503** when it does not.

**Success — 200**
```json
{
  "Api": "Running on Port 4000",
  "MongoDb": {
    "status": "ok",
    "timestamp": "ISO-8601 String",
    "services": {
      "database": {
        "status": "connected",
        "isHealthy": true
      }
    }
  }
}
```

`MongoDb.status` is `ok` or `degraded`; `services.database.status` is one of `connected`, `connecting`, `disconnecting`, `disconnected`.

**Degraded — 503**
```json
{
  "Api": "Running on Port 4000",
  "MongoDb": {
    "status": "degraded",
    "timestamp": "ISO-8601 String",
    "services": {
      "database": {
        "status": "disconnected",
        "isHealthy": false
      }
    }
  }
}
```

**Screenshot of health check**

---

### GET /

**Success — 200**
```json
{
  "message": "Welcome to the HustleHub+ API"
}
```

---

### GET /system-info

Only registered when `NODE_ENV === 'Dev'`. Otherwise the request falls through to the 404 handler.

**Success — 200**
```json
{
  "app": "String",
  "environment": "String"
}
```

---

### Unknown routes

Any request that matches no route above:

**404**
```json
{
  "message": "Route not found"
}
```

---

# 🧪 Postman Testing

The saved collection lives in [postman/](postman/) and is split so the same four requests can be run over either protocol:

```text
postman/
├── collections/
│   ├── http/        # http://localhost:4000
│   │   ├── api-auth-register.request.yaml
│   │   ├── api-auth-login.request.yaml
│   │   ├── api-auth-me.request.yaml
│   │   ├── -health.request.yaml
│   │   ├── -.request.yaml
│   │   └── FailedUrl.request.yaml
│   └── https/       # https://localhost:4000  (same six requests)
├── environments/
│   └── hustlehub+env.environment.yaml   # holds the auth_token variable
└── globals/
    └── workspace.globals.yaml
```

**Before you run it:** select the `hustlehub+env` environment, and if you are testing the HTTPS collection, disable SSL certificate verification in Postman (the dev certificate is self-signed).

### Test sequence

| # | Request | Expected | Why it matters |
|---|---------|----------|----------------|
| 1 | `POST /api/auth/register` | `201` + token | Proves hashing, validation and JWT issuance |
| 2 | `POST /api/auth/login` | `200` + token | Proves bcrypt comparison and re-issue; save the token to `auth_token` |
| 3 | `GET /api/auth/me` *(with token)* | `200` profile, no password | Proves the protected route works and strips the hash |
| 4 | `GET /health` | `200` + `MongoDb.status: "ok"` | Proves the API and database are both live |
| 5 | `GET /api/auth/me` *(no token)* | `401 No token provided` | Proves the route is genuinely protected |
| 6 | `GET /FailedUrl` | `404 Route not found` | Proves the catch-all does not leak internals |

---
