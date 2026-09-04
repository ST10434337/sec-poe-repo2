# 🚀 Application Setup & Usage

## 📋 Prerequisites

Before running the application, make sure you have **Node.js** and **npm** installed on your system.

You can verify your installation by running:

```bash
node --version
npm --version
```

Further please ensure you have a Mongodb running and have a connection setup and running. A Databes "hustlehub" will be created and used to store data.

---

## 🆕 First-Time Setup

If you are running the application for the **first time**, you need to generate the required certificates before starting the application.

Run:

```bash
npm install
npm run mkcert
```
***ONLY USE mkcert IN DEVELOPMENT***

This only needs to be done during the initial setup, unless the certificates need to be regenerated then rerun the `mkcert`.

---

## 💻 Running in Development Mode

For development, use:

```bash
npm run dev
```

Development mode is recommended when actively working on the application, as it provides the development environment and features such as hot reloading. reloading the program after any changes are saved

---

## ▶️ Running the Application Normally

For normal use, start the application with:

```bash
npm start
```

---

## ⚡ Quick Start

### First-Time Launch

```bash
npm install
npm run mkcert
npm run dev
```

### Development

```bash
npm run dev
```

### Normal Launch

```bash
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
  "role": "String (user | seller)"
}
```

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
| Status | Body |
|--------|------|
| 400 | `{ "message": "All fields required" }` |
| 409 | `{ "message": "Email already in use" }` |

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
| Status | Body |
|--------|------|
| 400 | `{ "message": "All fields required" }` |
| 401 | `{ "message": "Invalid credentials" }` |

---

### GET /api/auth/me

**Headers**


**Success — 200**
```json
{
  "email": "String",
  "name": "String",
  "role": "String"
}
```

**Errors**
| Status | Body |
|--------|------|
| 401 | `{ "message": "No token provided" }` |
| 401 | `{ "message": "Invalid or expired token" }` |

---

## System

### GET /health

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

**Success — 200**
```json
{
  "message": "Welcome to the HustleHub+ API"
}
```

---

### GET /system-info

**Success — 200**
```json
{
  "app": "String",
  "environment": "String"
}
```

