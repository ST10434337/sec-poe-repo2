# 🚀 Application Setup & Usage

## 📋 Prerequisites

Before running the application, make sure you have **Node.js** and **npm** installed on your system.

You can verify your installation by running:

```bash
node --version
npm --version
```

---

## 🆕 First-Time Setup

If you are running the application for the **first time**, you need to generate the required certificates before starting the application.

Run:

```bash
npm install
npm run mkcert
```

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
