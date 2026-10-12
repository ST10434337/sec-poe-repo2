# HustleHub+ — Setup Guide

How to run HustleHub+ on your own computer: Redis, the API and the React app.

**In short:** paste the `.env` files → start Redis → set up and start the API → accept the certificate → set up and start the app.

---

## 1. What you need

- **Node.js 22 or newer** (npm comes with it): https://nodejs.org
- **Git**: https://git-scm.com
- **Docker Desktop** (to run Redis): https://www.docker.com/products/docker-desktop
- **OpenSSL** (to make the HTTPS certificate). Git for Windows includes it. If `openssl` is not found, run the certificate step in **Git Bash**.
- **The `.env` files from the team.** They are **not** on GitHub. Ask a team member for them.

---

## 2. Get the code

```bash
git clone <repository URL>
```

```bash
cd insy7314-g1-part-2-and-poe-group-11
```

---

## 3. Paste the `.env` files

The `.env` files hold private settings (like the database connection and secrets), so they are never committed.

| Paste this file | Into this folder |
|---|---|
| The **API** `.env` | `HustleHub+/api/` |
| The **app** `.env` | `HustleHub+/app/` |
| `docker.env` (only for Docker Compose) | `HustleHub+/` |

The file must be named exactly `.env` (with the dot, and no `.txt` on the end).

---

## 4. Start Redis (in Docker)

The API uses Redis for rate limiting. Without it, API requests fail.

Make sure Docker Desktop is open, then run this **once**:

```bash
docker run -d --name hustlehub-redis -p 6379:6379 redis
```

Next time (for example after restarting your computer), just start it again:

```bash
docker start hustlehub-redis
```

---

## 5. Set up and start the API

Go to the API folder:

```bash
cd HustleHub+/api
```

Install the packages (first time, and after pulling new changes):

```bash
npm install
```

Make the HTTPS certificate (**only once**; it skips if the certificate already exists):

```bash
npm run mkcert
```

Start the API (it restarts by itself when you save a file):

```bash
npm run dev
```

You should see `Application listening on port 4000 (HTTPS)`. Leave this terminal open.

### Accept the certificate (important)

The certificate is self-signed, so browsers do not trust it until you allow it once.

1. In the browser you will use for the app, open `https://localhost:4000/health`.
2. You will see a warning page:
   - **Chrome / Edge:** click **Advanced**, then **Proceed to localhost (unsafe)**.
   - **Firefox:** click **Advanced…**, then **Accept the Risk and Continue**.
3. You should see the health info, with the database `connected`.

Each browser keeps its own list, so do this in every browser you use. You may need to do it again after closing the browser.

---

## 6. Optional: create an admin account

Admins cannot sign up through the app. This script creates one, using the admin details in the API `.env`.

In `HustleHub+/api`:

```bash
npm run create-admin
```

- Only needed **once per database**. If the team already has an admin, skip this.
- If that email already exists, it stops with an error and changes nothing.

---

## 7. Set up and start the app

Open a **second terminal**, and go to the app folder:

```bash
cd HustleHub+/app
```

Install the packages (first time, and after pulling new changes):

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Open **http://localhost:5173** in the browser where you accepted the certificate.

> The app must run on port **5173**. The API only accepts requests from that address (CORS).

---

## 8. Run the tests

**App tests** (in `HustleHub+/app`):

```bash
npm test
```

**App lint check** (in `HustleHub+/app`):

```bash
npx eslint .
```

**API tests:** open the Postman collection in `HustleHub+/api/postman` in Postman, with the API running.

---

## 9. Optional: run the built app with its security headers

This shows the Content Security Policy that protects the built app. Stop `npm run dev` first, because both use port 5173.

In `HustleHub+/app`:

```bash
npm run build
```

```bash
npm run preview
```

Open http://localhost:5173, press **F12**, open **Network**, click the page request, and look for `Content-Security-Policy` under **Response Headers**.

---

## 10. Ports used

| What | Address |
|---|---|
| App (dev and preview) | http://localhost:5173 |
| API | https://localhost:4000 |
| Redis | localhost:6379 |

---

## 11. Docker Compose

See [HustleHub+/docker-run.md](HustleHub+/docker-run.md). It needs the API `.env` and `docker.env` pasted (step 3).

> The app's Docker image is not finished yet. For now, run the app with the steps above.

---

## 12. Problems and fixes

| What you see | Fix |
|---|---|
| "Cannot reach the server. Check the API is running…" | Start the API (step 5), and accept the certificate in this browser. |
| Firefox: "CORS request did not succeed" | Accept the certificate **in Firefox** (step 5). |
| Most pages say "Something went wrong", or load very slowly | Redis is probably not running. Run `docker start hustlehub-redis`. |
| "Too many requests. Please wait…" | Wait 15 minutes. For local testing only, you can clear the limits: `docker exec hustlehub-redis redis-cli FLUSHALL` |
| `Port 5173 is in use` | Only one of `npm run dev` or `npm run preview` can run at a time. Stop the other one. |
| `openssl` is not recognised | Run `npm run mkcert` in **Git Bash**. |
| The API cannot connect to the database | Check the API `.env` is pasted in `HustleHub+/api/`. Your IP address may also need to be allowed in MongoDB Atlas (ask the team). |
| A page goes blank after pulling changes | Refresh the page. If it is still blank, stop and restart `npm run dev`. |

## 13. Database access (MongoDB Atlas) 

**The elephant in the room is Atlas has IP whilsting** so we would have to add your IP there in order for you, the marker to get the API working, and testing the project.

This left us with 3 options:
1. You can contact one of us so we can add your IP to the whitelist
2. We give you instructions on how to create your own cluster on Atlas and step you though how to get the connection string, add the admin password to it, and replace it in the `.env` file for the API.
3. Or just make everyone's life easier and intentionally unsafely set the database allowed IPs to all via `0.0.0.0/0`.

For everyone's sake we chose 3. Given we understand that normally it is taboo to allow any IP to connect to the database, we in good faith hope that you will not penalise us for this. 
