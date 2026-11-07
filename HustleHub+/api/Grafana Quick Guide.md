# Grafana Cloud Quick Guide (HustleHub)

How to view and search API logs in Grafana Cloud.

## 1. Get access

1. Accept the invite email from Grafana (ask the admin if you don't have one).
2. Sign in and open the team's stack: **https://YOURSTACK.grafana.net** (replace with your stack address).
3. Set your own password or use single sign-on if it's enabled. Never share logins.

Most people get the **Viewer** role (can view logs and dashboards). **Editor** is for people who build dashboards and alerts.

## 2. View logs

1. Left menu: **Explore** 
2. Select the Loki data source at the top left (usually named `grafanacloud-...-logs`) > Explore Data (Top Right)
3. Switch **Builder** to **Code** (toggle on the right)
4. Enter a query and press **Shift+Enter**
5. Set the time range at the top right, e.g. **Last 15 minutes**

## 3. Handy queries

| What you want | Query |
|---|---|
| All API logs | `{app="hustlehub-api"}` |
| Production only | `{app="hustlehub-api", env="production"}` |
| Development only | `{app="hustlehub-api", env="development"}` |
| Errors only | `{app="hustlehub-api"} \| json \| level="error"` |
| Warnings and errors | `{app="hustlehub-api"} \| json \| level=~"warn\|error"` |
| Auth events | `{app="hustlehub-api"} \| json \| tag="AUTH"` |
| Search for text | `{app="hustlehub-api"} \|= "logged in"` |
| Exclude text | `{app="hustlehub-api"} != "health"` |
| One user's activity | `{app="hustlehub-api"} \| json \| userId="abc123"` |

> If levels show as numbers instead of text, use `level="50"` for error, `40` for warn, `30` for info.
> Always include the `env` label when debugging, so production and development logs don't get mixed up.

|  |
|---|
|`AUTH`|
|`ERROR`|
|`GIGS`|
|`TRANSACTIONS`|
|`ADMIN`|
|`BOOKING`|
|`MONGO`|

## 4. Reading a log line

Click any line in Explore to expand it. Common fields:

- `level`: severity (info, warn, error, fatal)
- `tag`: category set in code (e.g. `AUTH`)
- `msg`: the log message
- `req` / `res`: request and response details (from `pino-http`)
- `err`: error message and stack trace

## 5. Adding logs in code

Put the data object first and the message second:

```js
const logger = require('./logger');
const authLog = logger.child({ tag: 'AUTH' });

authLog.info({ userId: user.id }, 'User has logged in');
logger.error({ err, userId: user.id }, 'Failed to save user');
```

### Tags

| Level | Use for |
|---|---|
| `debug` | Developer detail |
| `info` | Normal events |
| `warn` | Odd but not broken |
| `error` | An operation failed |
| `fatal` | App can't continue |

**Never log:** passwords, tokens, API keys, or full request bodies. Be careful with personal data such as emails.

## 6. Environment setup (for developers)

Logs are sent to Grafana Cloud using these variables. Put them in `./docker.env` (gitignored), never in the repo:

```
LOKI_HOST=https://logs-prod-XXX.grafana.net
LOKI_USER=<numeric user ID>
LOKI_API_KEY=<access policy token with logs:write>
```

- `LOKI_HOST` is the base URL only, with no `/loki/api/v1/push` on the end.
- Set `NODE_ENV` to `development` or `production` so the `env` label is correct.
- Set `LOG_LEVEL=debug` locally and `info` in production.
- In CI tests, leave `LOKI_HOST` unset (or set `LOG_LEVEL=silent`) so tests don't ship logs.
- Store `LOKI_API_KEY` in your CI/CD secrets for production.

After changing variables, restart the API:

```bash
docker compose up -d --build
```

## 7. Tips

- Use **Live** (top right in Explore) to tail logs in real time.
- Logs are sent in batches every ~5 seconds, so allow a short delay.
- Start with `{app="hustlehub-api"}` and a short time range, then narrow down.
- Use **Label browser** in Explore to see which labels exist.
- Keep labels to small, fixed sets (`app`, `env`, `tag`). Put IDs in the log body.

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| No logs appear | Hit an API route, wait ~5s, widen the time range. Check the `env` label matches. |
| Still nothing | Run `docker compose logs api` and look for `pino-loki` errors |
| `401` error in API logs | `LOKI_USER` or `LOKI_API_KEY` is wrong |
| `403` error in API logs | Token is missing the `logs:write` scope |
| Connection or DNS error | `LOKI_HOST` must start with `https://`, end in `.grafana.net`, and not contain `internal` |
| Can't see Explore | Ask an admin to check your role (Viewer or above) |
| Logs seem missing for production | Check the query includes `env="production"` and the time range is correct |

## 9. Admin: managing the team

- **Invite people:** in the Cloud Portal (grafana.com, My Account), open your stack and use the user/members settings, or in Grafana go to **Administration → Users and access**.
- **Roles:** Viewer for most people, Editor for dashboard builders, Admin for very few.
- **Tokens:** create them under **Administration → Users and access → Cloud access policies**. Use `logs:write` for the app only. Give each environment its own token if possible, so a leaked one can be revoked without breaking the others.
- **Rotate tokens** if they were ever pasted into chat, a ticket, or the repo.

## Security notes

- Keep `LOKI_API_KEY` and other secrets out of the repo and out of screenshots.
- Don't give shared logins; invite each person individually.
- Remove people from the stack when they leave the team.