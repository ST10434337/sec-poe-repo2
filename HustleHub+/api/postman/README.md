# HustleHub+ API Postman tests

Import `tests/hustlehub-api.postman_collection.json` and
`tests/HustleHub+ API tests.postman_environment.json` into Postman, then select
the **HustleHub+ API tests** environment.

Login and registration requests save JWTs to environment variables. Protected
requests use the client, freelancer, or admin JWT required by that route.

## Setup

1. Start the API and a MongoDB replica set. Booking and status updates require
   MongoDB transactions.
2. Configure the API process with `NODE_ENV=test`,
   `ENABLE_TEST_CLEANUP=true`, and an `MONGO_URI` whose database name ends in
   `_test` (for example, `hustlehub_test`). Use a dedicated test database; the
   cleanup request permanently deletes its application data.
3. Create or configure an admin account in that test database, then set
   `admin_email` and `admin_password` in the Postman environment. The collection
   does not create admin accounts.
4. Set `base_url` to the API URL. The default is `https://localhost:4000`;
   trust the local development certificate or use HTTP if configured.
5. Run the full collection in order. It registers client and freelancer test
   accounts, creates gigs and bookings, exercises booking/payment status flows,
   and ends with `DELETE /api/test/cleanup`.

The cleanup endpoint is disabled unless both test-mode settings are enabled,
requires an admin token, and independently refuses to run unless the connected
database name ends with `_test`. It removes all transaction, booking, and gig
documents and all non-admin users. It preserves admin user documents and
returns deletion counts. Collections and indexes are retained. Run the
collection only against the dedicated test database.

The development-only `/system-info` test accepts either `200` or `404`,
depending on `NODE_ENV`.
