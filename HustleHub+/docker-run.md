# Run HustleHub+ with Docker Compose

Docker Desktop (or another Docker Engine with Compose) must be installed and
running. The Compose setup builds the API from `api/` and the React client from
`app/`, and starts Redis for the API rate limiter. MongoDB is expected to be
reachable using the `MONGO_URI` in `docker.env`; Compose does not start a local
MongoDB container.

## Configure

From the repository root, move into the project directory:

```powershell
Set-Location .\HustleHub+
```

Confirm `docker.env` contains a valid `MONGO_URI` and `api/.env` contains the
other required API settings, including `JWT_SECRET`. Keep real credentials out
of source control. The Compose configuration sets the API port to `4000`,
disables HTTPS inside the container, and allows the client origin at
`http://localhost:3000`.

## Build and run

Build both images:

```powershell
docker compose build
```

Start the API and client:

```powershell
docker compose up
```

The client is available at `http://localhost:3000`; the API is available at
`http://localhost:4000`. Check API/database health at
`http://localhost:4000/health`. The first build may take a few minutes while
Docker installs the application dependencies.

## Rebuild or restart

Rebuild both images:

```powershell
docker compose up --build
```

## Logs and shutdown

`docker compose up` streams container logs in the terminal. To view logs later:

```powershell
docker compose logs -f
```

Press `Ctrl+C` to stop the running services, then remove the containers and
network with:

```powershell
docker compose down
```

After changing the API or client, rebuild and start again with:

```powershell
docker compose build
docker compose up
```
