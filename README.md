# HustleHub+  INSY7314 Part 2 
**Project:** HustleHub+ freelance services marketplace  
**Student numbers:** ST10443441, ST10294763, ST10434337  
**Stack:** React, React Router, Vite, Node.js, Express, MongoDB, Mongoose and Redis  

Youtube video link: [Link](https://youtu.be/xwSR9-3D9n8)

---
## Documentation contained in this repo

| Document | What it covers | Read it when |
|---|---|---|
| [SETUP.md](SETUP.md) | Step-by-step local setup: `.env` files, Redis, API, certificate, app, tests | You want to run the project |
| [docker-run.md](HustleHub+/docker-run.md) | Running the API, app and Redis with Docker Compose | You want to use Docker instead |
| [api/Readme.md](HustleHub+/api/Readme.md) | API commands, first admin, full endpoint reference with examples | You need the details of an endpoint |
| [postman/README.md](HustleHub+/api/postman/README.md) | Running the Postman API tests on a test database | You want to run the API tests |
| [documentation.md](HustleHub+/documentation.md) | Backend helpers: rate limiter, auth, password and error handling | You want to understand the backend code |
| [Part1_README.md](Part1_README.md) | Part 1 submission: secure backend design and video | You want the Part 1 background |

----

## 1. Project overview

HustleHub+ is a freelance services marketplace developed to make it easier for clients to find services and for freelancers to offer their work in one place. Clients can
explore available gigs, make bookings and keep track of their transactions. Freelancers can create and manage their listings, handle bookings and view income information.
Administrators have separate tools for managing users, moderating gigs and reviewing transactions. The project uses React for the user interface, Express for the API and
MongoDB for data storage (React, n.d.; Express, n.d.; MongoDB, n.d.).


## 2. System architecture

```text
Browser / React + Vite (app/)
    | JSON over HTTP(S), Bearer JWT
    v
Express API (api/index.js)
    |-- Helmet, CORS, JSON parsing and body sanitisation
    |-- Authentication and role-based route protection
    |-- Controllers and business services
    |-- Mongoose models -> MongoDB
    `-- Redis-backed rate limiting configuration
```

### Repository layout

```text
HustleHub+/
  app/
    src/api/          API request utilities
    src/auth/         Authentication provider and route guards
    src/components/   Shared layout and interface components
    src/pages/        Marketplace, booking, account and admin pages
    src/utils/        Constants, formatting and validation
  api/
    config/           Database configuration
    controllers/      HTTP request handlers
    middleware/       Authentication, sanitisation, rate limiting and errors
    models/           User, Gig, Booking and Transaction schemas
    routes/           REST endpoint declarations
    services/         Booking and income business operations
    postman/          API testing assets
  docker-compose.yml
Images/
README.md
```

## 3. Frontend implementation

The frontend is built with **React 19**, **React Router 7** and **Vite 8**. The routes in `src/App.jsx` determine which page is shown, while `ProtectedRoute` limits
access to pages intended for signed-in users or particular roles. Authentication state is handled in `src/auth/`, and shared interface elements are kept in
`src/components/`. Organising the frontend this way makes pages easier to maintain and helps avoid repeating the same interface code (React, n.d.; React Router, n.d.).

| Interface / URL | Function | Access |
|---|---|---|
| `/login`, `/register` | Account authentication and registration | Public |
| `/gigs`, `/gigs/:id` | Browse and inspect gig listings | Public |
| `/account` | Current-user account information | Signed-in user |
| `/bookings`, `/bookings/:id` | Booking list and detail views | List: client/freelancer; detail: signed-in user, with API ownership checks |
| `/transactions` | User transaction history | Client/freelancer |
| `/my-gigs`, `/my-gigs/new`, `/my-gigs/:id/edit` | Freelancer gig administration | Freelancer |
| `/admin/users`, `/admin/transactions` | User and transaction administration | Administrator |

Opening the root URL takes the user to `/gigs`, and unknown routes show a not-found page. The `src/api/client.js` helper handles communication with the API, including the
configured base URL, JSON requests, bearer tokens and error responses. Frontend route protection helps guide users to the right pages, but it does not replace the
role and ownership checks performed by the backend (OWASP Foundation, n.d.).

### Frontend validation and testing

The project includes input-validation helpers in `src/utils/validation.js` and a corresponding Vitest test file, `src/utils/validation.test.js`. The existing tests can be
run with `npm test` from the `app/` folder. These files show that frontend validation tests have been written; they do not, on their own, establish that every page or
interaction has been tested. Component and user-interaction tests would be useful additions (Vitest, n.d.).

## 4. REST API endpoint reference

For local development, the API uses `http://localhost:4000` as its base URL. The paths below are added to that address. The access column reflects the route-level
permissions; controllers may also check who owns a resource, whether the request is valid and whether a status change is allowed.

| Method | Endpoint | Route access |
|---|---|---|
| `GET` | `/api/admin/users` | Admin |
| `PATCH` | `/api/admin/users/:id/status` | Admin |
| `DELETE` | `/api/admin/gigs/:id` | Admin |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/auth/me` | Authenticated |
| `POST` | `/api/auth/become-freelancer` | Client, Freelancer |
| `PATCH` | `/api/auth/users/:userId/role` | Admin |
| `POST` | `/api/bookings` | Client |
| `GET` | `/api/bookings/my-bookings` | Client |
| `GET` | `/api/bookings/freelancer` | Freelancer |
| `GET` | `/api/bookings/:id` | Client, Freelancer, Admin |
| `PATCH` | `/api/bookings/:id/status` | Freelancer |
| `PATCH` | `/api/bookings/:id/cancel` | Client |
| `GET` | `/api/gigs` | Public |
| `GET` | `/api/gigs/my-gigs` | Freelancer |
| `GET` | `/api/gigs/:id` | Public |
| `POST` | `/api/gigs` | Freelancer |
| `PUT` | `/api/gigs/:id` | Freelancer |
| `DELETE` | `/api/gigs/:id` | Freelancer |
| `GET` | `/api/transactions/my-transactions` | Client, Freelancer |
| `GET` | `/api/transactions/income` | Freelancer |
| `GET` | `/api/transactions` | Admin |
| `GET` | `/api/transactions/:id` | Client, Freelancer, Admin |

### Operational endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | API welcome response |
| `GET` | `/health` | API and database connectivity status; returns 503 when the database is unhealthy |
| `GET` | `/system-info` | Application/environment information only when `NODE_ENV=Dev` |

### Request 

**Register:** `POST /api/auth/register` with JSON properties `name`, `email`, `password` and `role` (subject to server validation).  
**Log in:** `POST /api/auth/login` with `email` and `password`.  
**Authenticated call:** include `Authorization: Bearer YOUR_JWT` when calling protected endpoints.  
**Create a gig:** `POST /api/gigs` requires a freelancer token and a body that satisfies the gig controller/model validation.  
**Book a gig:** `POST /api/bookings` requires a client token and a valid booking request.  
**Update booking status:** `PATCH /api/bookings/:id/status` is reserved for freelancers; the controller enforces permissible transitions.

The examples above are a starting point for using the API. For the exact required fields, validation rules and response structures, consult `api/controllers/`,
`api/models/` and the Postman files in `api/postman/`.

## 5. Authentication, authorisation and security

Registration and login are public. Successful authentication supplies a JSON Web Token used on subsequent protected calls. The authentication middleware validates
requests, while `allowRoles` restricts sensitive routes to client, freelancer or administrator roles. Booking access and gig modification also require business-level
ownership checks (Jones, Bradley and Sakimura, 2015; OWASP Foundation, n.d.).

Security mechanisms present in the supplied code include:

- **Password handling:** user passwords are hashed through the user model rather than returned in plaintext.
- **Security headers:** Helmet configures Content Security Policy and related HTTP headers; `X-Powered-By` is disabled.
- **Cross-origin restrictions:** CORS uses `CLIENT_ORIGIN` and allows GET, POST, PUT, PATCH and DELETE with the Content-Type and Authorization headers.
- **Input sanitisation:** request-body keys containing a dot or beginning with `$` are rejected before routing to reduce NoSQL operator-injection exposure.
- **Rate limiting:** authentication, gig, booking and admin routes use configured rate limits; Redis is part of the infrastructure.
- **Error responses:** a central error handler and unknown-route fallback prevent uncontrolled responses.
- **Transport:** the API supports optional local HTTPS using certificate paths; production TLS requires appropriate deployment configuration.

These measures help protect the application, but they should not be presented as evidence that a penetration test or full production security assessment has been
completed (OWASP Foundation, n.d.; Helmet, n.d.).

## 6. Data and business workflows

The backend contains four main Mongoose models: `User`, `Gig`, `Booking` and `Transaction`. Together, they support the main marketplace activities: managing accounts and
gigs, creating and updating bookings, viewing transaction history and checking freelancer income. The routes also include administrator functions. Gig deletion is
handled as soft deletion in the implementation, while booking changes go through backend logic instead of allowing the browser to set any status it chooses (Mongoose,
n.d.).

## 7. Local setup

**Prerequisites:** Node.js/npm, a reachable MongoDB instance, and any Redis instance required by the configured rate limiter. Do not commit actual `.env` credentials.

### Backend

```bash
cd HustleHub+/api
npm install
npm run dev
```

Configure `api/.env` before starting. Check `api/config/db.js`, `api/index.js` and `api/middleware/rateLimit.js` for the environment variables needed in your chosen
configuration. Variables referenced by the project include `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`, `USE_HTTPS`, `SSL_KEY_PATH`,
`SSL_CERT_PATH`, `REDIS_URL` and `NODE_ENV`. MongoDB connectivity must be working for database-backed endpoints.

### Frontend

```bash
cd HustleHub+/app
npm install
```

Create `app/.env` using the included `.env.example` and set the API URL, for example:

```dotenv
VITE_API_URL=http://localhost:4000
```

Then start the development server:

```bash
npm run dev
```

Vite normally serves the local client at `http://localhost:5173`; the API's `CLIENT_ORIGIN` must match the actual browser origin. Run `npm run build` to check the
frontend production bundle. The API also supports `npm start` for a non-watch process.

### Docker Compose

The included `HustleHub+/docker-compose.yml` defines **api**, **client** and **redis** services. It publishes the client on `http://localhost:3000` and API on
`http://localhost:4000` and references `api/.env` plus `docker.env` for the API. Start it from `HustleHub+/` with:

```bash
docker compose up --build
```

**Important:** The supplied Compose file does **not** define a MongoDB service. Provide an accessible MongoDB connection string through the environment files or add a
correctly configured MongoDB service before expecting database-backed functionality to work. Redis has a health check and is used by the API's rate-limiting
infrastructure (Docker, n.d.).

## 8. Testing and evidence

| Area | Included evidence / how to check | Status supported by archive |
|---|---|---|
| Frontend validation | `app/src/utils/validation.test.js`; run `npm test` from `app/` | Test source present; execution not verified here |
| Frontend build | `npm run build` from `app/` | Command configured; result not verified here |
| API requests | Postman assets in `api/postman/` and screenshots in `Images/` | Assets present; latest run results not verified |
| Backend automated tests | `api/package.json` contains a placeholder `npm test` script | No passing backend test suite established |
| Container startup | `docker compose up --build` | Configuration present; successful runtime not verified |
| Role and ownership protection | Route middleware and controllers | Implemented in source; requires integration verification |

Suggested verification sequence: start MongoDB and Redis; launch the API; check `/health`; register test client/freelancer accounts; verify token and role restrictions;
exercise gig creation, discovery and booking; inspect transaction/income routes; run negative tests for missing tokens, invalid input and unauthorised access; run
frontend validation tests and build. Record actual responses and screenshots before claiming success.


## 9. Design rationale

We separated the interface from the API so that changes to the website do not require database logic to be placed in React components. The endpoints are grouped by
feature, making it easier to find the code responsible for accounts, gigs, bookings and transactions. Mongoose defines the data models, while JWT authentication and
backend permission checks help control access. Validation, security headers and rate limiting provide additional protection alongside those checks (Express, n.d.; Jones, 
Bradley and Sakimura, 2015; OWASP Foundation, n.d.).

## 10. References 

Docker (n.d.) *Docker Compose documentation*. Available at: https://docs.docker.com/compose/ (Accessed: 09 October 2026).

Express (n.d.) *Express – Node.js web application framework*. Available at: https://expressjs.com/ (Accessed: 08 October 2026).

Helmet (n.d.) *Helmet documentation*. Available at: https://helmetjs.github.io/ (Accessed: 11 October 2026).

Jones, M., Bradley, J. and Sakimura, N. (2015) *JSON Web Token (JWT)*. RFC 7519. Internet Engineering Task Force. Available at: https://www.rfc-editor.org/rfc/rfc7519 (Accessed: 12 October 2026).

Mongoose (n.d.) *Mongoose documentation*. Available at: https://mongoosejs.com/docs/ (Accessed: 07 October 2026).

MongoDB (n.d.) *MongoDB documentation*. Available at: https://www.mongodb.com/docs/ (Accessed: 11 October 2026).

OWASP Foundation (n.d.) *OWASP API Security Top 10 – 2023*. Available at: https://owasp.org/API-Security/editions/2023/en/0x11-t10/ (Accessed: 06 October 2026).

React (n.d.) *React documentation*. Available at: https://react.dev/ (Accessed: 04 October 2026).

React Router (n.d.) *React Router documentation*. Available at: https://reactrouter.com/ (Accessed: 05 October 2026).

Vitest (n.d.) *Vitest guide*. Available at: https://vitest.dev/guide/ (Accessed: 05 October 2026).

