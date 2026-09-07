# 🚀 Application Setup & Usage

## 📋 Prerequisites

Before running the application, make sure you have **Node.js** and **npm** installed on your system.

You can verify your installation by running:

```bash
node --version
npm --version
```

Ensure that you have **mongodb installed** too.
Download and install it from [here](https://www.mongodb.com/products/self-managed/community-edition) if you don't already have it installed on your machine. 


Further please ensure you have a Mongodb running and have a connection setup and running. A Database "hustlehub" will be created and used to store data.


## 🆕 First-Time Setup

If you are running the application for the **first time**, you need to generate the required certificates before starting the application.

Run:

```bash
cd HustleHub+
npm install
npm run mkcert
```
***ONLY USE mkcert IN DEVELOPMENT***

This only needs to be done during the initial setup, unless the certificates need to be regenerated then rerun the `mkcert`.

---

## 💻 Running in Development Mode

For development, use:

```bash
cd HustleHub+
npm run dev
```

Development mode is recommended when actively working on the application, as it provides the development environment and features such as hot reloading. reloading the program after any changes are saved

---

## ▶️ Running the Application Normally

For normal use, start the application with:

```bash
cd HustleHub+
npm start
```

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
| 🆕 npm Install           | `npm install`
| 🆕 Generate certificates | `npm run mkcert` |
| 💻 Development mode      | `npm run dev`    |
| ▶️ Normal start          | `npm start`      |

---

## 🔄 Typical Workflow

If this is your **first time running the application**:

```text
1. Install dependencies
        ↓
2. Run npm run mkcert
        ↓
3. Run npm run dev
        ↓
4. Application starts
```

For future development sessions:

```text
Run npm run dev
        ↓
Application starts
```

For a normal application launch:

```text
Run npm start
        ↓
Application starts
```


# API Reference

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
*Validation Rules*
- All 4 fields are required.
- The email address must use a valid email format.
- Email addresses are stored in lowercase and trimmed.
- The password must be at least **8 characters** long.
- The password must contain:
  - An uppercase letter
  - A lowercase letter
  - A number
  - One special character from `@ $ ! % * ? &`
- The role must be one of:
  - `user`
  - `seller`
  - `admin`


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
| Status | Response | Cause |
|---|---|---|
| `400` | `{ "message": "All fields are required" }` | A required field is missing |
| `400` | `{ "message": "Invalid email format" }` | Invalid email format |
| `400` | `{ "message": "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character" }` | Password does not meet the requirements |
| `400` | `{ "message": "Email already in use" }` | Email already exists |
| `400` | `{ "message": "Validation error" }` | Schema validation failed |
| `500` | `{ "message": "Server error" }` | Unexpected server-side error |

---

### POST /api/auth/login

Authenticates an existing user and returns a JWT authentication token.

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
| Status | Response | Cause |
|---|---|---|
| `400` | `{ "message": "Email and password are required" }` | Email or password is missing |
| `401` | `{ "message": "Invalid credentials" }` | Email or password is incorrect |
| `500` | `{ "message": "Server error" }` | Unexpected server-side error |

For security, the API returns the same `Invalid credentials` response whether the email does not exist or the password is incorrect.

---

### GET /api/auth/me

Returns the profile of the currently authenticated user.

**Headers**
```http
Authorization: Bearer <token>
```

**Success — 200**
```json
{
  "email": "String",
  "name": "String",
  "role": "String"
}
```

The user's password hash is never returned by the API.

**Errors**
| Status | Response | Cause |
|---|---|---|
| `401` | `{ "message": "No token provided" }` | Authentication token is missing or malformed |
| `401` | `{ "message": "Invalid or expired token" }` | Token is invalid or expired |
| `404` | `{ "message": "User not found" }` | The user associated with the token no longer exists |
| `500` | `{ "message": "Server error" }` | Unexpected server-side error |

---

## System

### GET /health

Checks whether the API and MongoDB connection are operational.

A successful health check returns HTTP `200`.

**Success — 200**
```json
{
  "api": "Running on Port ####",
  "mongoDb": {
    "status": "String",
    "timestamp": "String",
    "services": {
      "database": {
        "status": "String",
        "isHealthy": true
      }
    }
  }
}
```


---

### GET /

Returns the API welcome message.

**Success — 200**
```json
{
  "message": "Welcome to the HustleHub+ API"
}
```

---

### GET /system-info

Returns basic application information.

**Success — 200**
```json
{
  "app": "String",
  "environment": "String"
}
```

