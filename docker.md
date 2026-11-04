# HustleHub – Running with Docker

## Prerequisites
- Docker Desktop running (`docker --version`, `docker compose version`)
- `api/.env` exists
- `docker.env` exists
- `package-lock.json` exists in both `api/` and `app/` 'use `npm install` in each folder
- Your IP is allowed in MongoDB Atlas (Network Access)

## First-time setup

### 1. Generate the SSL certs (on your machine, not in Docker)
Run your cert script from the `api/` folder. Use your real script name:

```
cd api
npm run generate-certs
cd ..
```

Check that these exist:
- `api/certs/localhost-key.pem`
- `api/certs/localhost-cert.pem`

The certs are mounted into the container at `/app/certs`. Re-run the script only if they expire or go missing.

### 2. Build and start
```
docker compose up -d --build
```

### 3. Check that everything is up
```
docker compose ps
docker compose logs -f api
```
`api` and `redis` should show as healthy.

### 4. Create the admin user
Run the admin script inside the running API container. Use your real script name:

```
docker compose exec api npm run create-admin
```

### 5. Open the app
- Frontend: http://localhost:3000
- API: https://localhost:4000 (open it once and accept the cert warning if it isn't trusted)

## Everyday commands

| Task | Command |
|------|---------|
| Start | `docker compose up -d` |
| Stop (keeps data) | `docker compose down` |
| Rebuild after code changes | `docker compose up -d --build` |
| Rebuild one service | `docker compose up -d --build api` (or `client`) |
| Apply `.env` changes | `docker compose up -d --force-recreate api` |
| View logs | `docker compose logs -f api` |
| Shell into the API | `docker compose exec api sh` |
| Check env inside API | `docker compose exec api printenv` |

## Rebuild from scratch

If a change isn't taking effect:
```
docker compose down
docker compose build --no-cache
docker compose up -d
```

Full reset (also wipes the Redis volume and built images):
```
docker compose down -v --rmi local
docker builder prune -f
docker compose build --no-cache
docker compose up -d
```
MongoDB data lives in Atlas and is not affected by a reset.

## Troubleshooting

- **API won't connect to Mongo:** check `docker compose logs api`. Common causes are the Atlas IP allowlist, a wrong password (URL-encode special characters), or `MONGO_URI` not matching the variable name your code reads.
- **API crashes on start with HTTPS on:** the certs are missing. Check `docker compose exec api ls /app/certs`.
- **Env value looks wrong:** values under `environment:` in `docker-compose.yml` override `api/.env`, and `docker.env` overrides `api/.env`.
- **Frontend can't reach the API:** the API URL is baked in at build time, so rebuild the client after changing it.

## Security
- Never commit `docker.env`, `api/.env`, or `api/certs/`.
- If a credential was ever shared or committed, rotate it.