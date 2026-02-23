# Fix "Application failed to respond" on Railway

That error means the Node app **never starts** or **crashes right away**. Requests then hit Railway’s error page (no CORS, so you see CORS errors in the browser). Fix the deploy so the server actually runs.

## 1. Set Root Directory to `server`

Railway must build and run the **backend**, not the repo root.

- Open your **Wehere** service in Railway.
- Go to **Settings** (or the service’s config).
- Find **Root Directory** / **Source Directory** / **Monorepo Root**.
- Set it to: **`server`** (no leading slash).
- Save.

Without this, Railway uses the repo root, runs the wrong `package.json`, and the API never starts.

## 2. Build and start commands

The repo has **server/railway.toml** with:

- **Build:** `npm ci && npm run build && npx prisma generate && npx prisma db push`
- **Start:** `npm run start` (runs `node dist/index.js`)

If your service still has custom commands in the dashboard, they should match this (or remove them so Railway uses the config file).

## 3. Required variables

In the service **Variables** tab, set at least:

| Variable | Example / note |
|----------|-----------------|
| `DATABASE_URL` | `file:./dev.db` for SQLite (or a Railway Postgres URL if you add a DB). |
| `JWT_SECRET` | Any long random string. |
| `TICKETMASTER_API_KEY` | Your Ticketmaster API key (for event search). |

If `DATABASE_URL` is missing or wrong, the app can crash on startup when Prisma runs.

## 4. Redeploy and check logs

- Trigger a **new deploy** (push to `main` or “Redeploy” in Railway).
- After the deploy, open **Deployments** → latest deploy → **View logs**.

Check for:

- **Success:** A line like `WeHere API running at http://localhost:XXXX` near the end.
- **Failure:** Red errors before that (e.g. `Cannot find module`, Prisma/database errors, “EADDRINUSE”, etc.). Those explain why the app doesn’t respond.

## 5. Test the API

When logs show the server running, try in order:

1. **Ping (no DB):**  
   **https://wehere-production.up.railway.app/api/ping**  
   - Expect: `{"pong":true}`  
   - If this fails (timeout, 502, “Application failed to respond”), the process is not running or not reachable. Recheck Root Directory, start command, and deploy logs.

2. **Health (uses DB):**  
   **https://wehere-production.up.railway.app/api/health**  
   - Expect: `{"ok":true,"message":"WeHere API"}`  
   - If ping works but health is 503, the app is up but the database is missing or wrong (check `DATABASE_URL` and that `prisma db push` ran in the build).

If **ping** works, the API is up and CORS will work for the frontend (same origin is allowed in code).
