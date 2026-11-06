# Grafana Quick Guide (HustleHub)

How to view and search API logs once the Docker stack is running.

## 1. Start the stack

```bash
docker compose up -d --build
docker compose ps        # api, loki and grafana should all be "running"
```

## 2. Open Grafana

- URL: **http://localhost:3200**
- First login: `admin` / `admin` (you'll be asked to set a new password; do it)

## 3. One-time setup: connect Loki

Only needed the first time (or after deleting the `grafana_data` volume).

1. Left menu: **Connections → Data sources → Add data source**
2. Choose **Loki**
3. URL: `http://loki:3100` (use `loki`, not `localhost`; Grafana runs inside Docker)
4. Click **Save & test**. You should see a green "successfully connected" message.

## 4. View logs

1. Left menu: **Explore** (compass icon)
2. Select the **Loki** data source (top left)
3. Switch **Builder** to **Code** (toggle on the right)
4. Enter a query and press **Shift+Enter**
5. Set the time range (top right), e.g. **Last 15 minutes**

## 5. Handy queries

| What you want | Query |
|---|---|
| All API logs | `{app="hustlehub-api"}` |
| Errors only | `{app="hustlehub-api"} \| json \| level="error"` |
| Warnings and errors | `{app="hustlehub-api"} \| json \| level=~"warn\|error"` |
| Auth events | `{app="hustlehub-api"} \| json \| tag="AUTH"` |
| Search for text | `{app="hustlehub-api"} \|= "logged in"` |
| Exclude text | `{app="hustlehub-api"} != "health"` |
| One user's activity | `{app="hustlehub-api"} \| json \| userId="abc123"` |
| Slow requests (over 1s) | `{app="hustlehub-api"} \| json \| responseTime > 1000` |

> If levels show as numbers instead of text, use `level="50"` for error, `40` for warn, `30` for info.

### Tags

|  |
|---|
|`AUTH`|
|`ERROR`|
|`GIGS`|
|`TRANSACTIONS`|
|`ADMIN`|
|`BOOKING`|
|`MONGO`|


## 6. Reading a log line

Click any line in Explore to expand it. Fields you'll see:

- `level`: severity (info, warn, error, fatal)
- `tag`: category set in code (e.g. `AUTH`)
- `msg`: the log message
- `req` / `res`: request and response details (from `pino-http`)
- `err`: error message and stack trace

## 7. Adding logs in code

Put the data object first and the message second:

```js
const logger = require('./logger');
const authLog = logger.child({ tag: 'AUTH' });

authLog.info({ userId: user.id }, 'User has logged in');
logger.error({ err, userId: user.id }, 'Failed to save user');
```

| Level | Use for |
|---|---|
| `debug` | Developer detail |
| `info` | Normal events |
| `warn` | Odd but not broken |
| `error` | An operation failed |
| `fatal` | App can't continue |

**Never log:** passwords, tokens, API keys, or full request bodies.

## 8. Tips

- Use **Live** (top right in Explore) to tail logs in real time.
- Logs are sent in batches every ~5 seconds, so allow a short delay.
- Keep queries narrow: start with `{app="hustlehub-api"}` and a short time range.
- Use **Label browser** in Explore to see which labels exist.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Grafana won't open | Check the port mapping is `"3200:3000"` and run `docker compose ps` |
| Save & test fails | Make sure the `loki` container is running; the URL must be `http://loki:3100` |
| No logs appear | Hit an API route, wait ~5s, widen the time range; check `LOKI_HOST: http://loki:3100` is set on the `api` service |
| Still nothing | Run `docker compose logs api` and look for `pino-loki` errors |
| Lost dashboards/settings | Make sure the `grafana_data` and `loki_data` volumes exist; avoid `docker compose down -v` |

## 10. Useful commands

```bash
docker compose logs -f api       # live API console logs
docker compose logs grafana      # Grafana startup errors
docker compose restart grafana   # restart Grafana
docker compose down              # stop the stack (keeps data)
```

## Security notes

- Don't expose ports 3100 (Loki) or 3200 (Grafana) publicly.
- Change the default Grafana password.
- Keep `LOKI_API_KEY` and other secrets out of the repo.