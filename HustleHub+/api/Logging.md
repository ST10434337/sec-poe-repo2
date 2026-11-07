# Logging

The API uses Pino for application logs. Logs help operators understand service
startup and database connectivity, follow important account and business
actions, and diagnose unexpected server errors.

## Configuration and destinations

The shared logger is configured in `api/utils/logger.js`:

- The logger name is `hustlehub-api`.
- The minimum level is controlled by `LOG_LEVEL`; it defaults to `info`.
  Messages below that level are not emitted.
- Logs are written to standard output.
- If `LOKI_HOST` is set, the same logs are also sent to Loki with the labels
  `app=hustlehub-api` and `env=<NODE_ENV>` (defaulting to `development`).
  Loki delivery is batched at five-second intervals.
- Pino redacts `req.headers.authorization` and `req.headers.cookie` if those
  fields are included in a logged object.

Docker Compose sets `LOKI_HOST` to `http://loki:3100` and `LOG_LEVEL` to
`silent` for the API container. As a result, the configured Pino logger emits
no application logs in the default Compose configuration. Change `LOG_LEVEL`
to `info` (or another desired level) to enable them. Compose also starts
Grafana and Loki; Grafana may need a Loki data source configured before logs
can be explored in its interface.

For local development, set `LOG_LEVEL` as needed. To send logs to Loki, also
set `LOKI_HOST` to a reachable Loki endpoint. Without `LOKI_HOST`, Pino logs
only to standard output.

## What is logged

| Area | Events | Why |
| --- | --- | --- |
| API startup (`api/index.js`) | Environment files loaded, test/development system-info availability, HTTP or HTTPS startup, and listening port | Confirms which configuration was loaded and whether the server started in the expected mode. |
| MongoDB (`api/config/db.js`) | Successful connection; connection failure, with the error message included in development mode | Helps diagnose database availability during startup. A connection failure exits the process. |
| Authentication (`api/controllers/authController.js`) | User registration, successful login, profile retrieval, becoming a freelancer, and role updates; handler errors include an error message | Provides an audit trail for key account changes and helps investigate failures in authentication handlers. Successful account events include the user ID. |
| Gigs (`api/controllers/gigController.js`) | Public gig searches and detail views, a freelancer's own gig list and access, and gig creation, updates, and soft deletion | Shows when gig data is accessed or changed, including the relevant user or gig IDs where supplied. |
| Bookings (`api/controllers/bookingController.js`) | Booking creation, client/freelancer booking lists, booking detail access, status changes, and cancellations | Supports tracing the booking lifecycle and its responsible user. |
| Transactions (`api/controllers/transactionController.js`) | Transaction page access (page, limit, and total), a user's transaction access, income-summary access, tax-summary access, a warning when an older tax table is used, individual transaction access, and admin listing. User, role, transaction, and pagination values are included in log messages where available. | Helps trace access to payment records and income summaries, and provides context for investigating transaction queries. |
| Administration (`api/controllers/adminController.js`) | User listing, account status changes, and moderation deletion of gigs. Account status and gig deletion logs include the acting admin's ID and the affected record ID. | Provides an audit trail for administrative reads and changes. |
| Central error handler (`api/middleware/errorHandler.js`) | The error message for errors passed to the handler | Helps diagnose unexpected request failures; clients receive a generic error response rather than the logged message. |

Most business-event messages are logged at `info`; errors that reach the
central handler and selected controller failures are logged at `error`.
Environment-specific setup messages may use `warn`.
Authentication and booking events generally attach a user ID as structured
data. Gig and transaction identifiers and pagination values are generally
included in message text instead. The user-list log currently supplies the
imported `logUtils` value as `userId`, rather than the requesting admin's ID;
do not rely on that field to identify the actor.

## Logging considerations

Treat logs as operational records: restrict access to log storage, avoid adding
credentials or sensitive request data to log statements, and use stable
structured fields for values that operators need to search or aggregate.
Pino redaction only applies to the configured field paths; it is not a general
secrets scanner.
