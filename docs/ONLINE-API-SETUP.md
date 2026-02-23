# Why the online app doesn’t use Ticketmaster (and how to fix it)

**GitHub Pages only serves the frontend** (HTML/JS/CSS). There is **no backend** running on GitHub, so the live site has nowhere to call for Ticketmaster, auth, or events.

- **Locally:** Frontend (Vite) + backend (Node) both run; you set `VITE_API_URL=http://localhost:3001` and the app talks to your server → Ticketmaster works.
- **Online:** Only the built frontend is deployed; no server → no API, so Ticketmaster (and other API features) don’t run.

## Make Ticketmaster (and the full API) work online

You need a **deployed backend** and to tell the frontend build to use it.

### 1. Deploy the backend

Host the **Wehere server** (the `server/` folder) on a service that runs Node, for example:

- **[Railway](https://railway.app)** – free tier, simple deploy from GitHub
- **[Render](https://render.com)** – free tier, “Web Service” from repo
- **[Fly.io](https://fly.io)** – free tier, CLI deploy

For all of them you’ll:

- Connect the **Wehere** repo (or only the `server/` part).
- Set **start command** to something like: `cd server && npm install && npm run build && node dist/index.js` (or `npx tsx src/index.ts` if they support that).
- Add **environment variables** in the host’s dashboard, especially:
  - `TICKETMASTER_API_KEY` (your Ticketmaster Consumer Key)
  - Any DB or other keys your server needs (see `server/.env.example`).
- Get the **public URL** of your backend, e.g. `https://wehere-api.railway.app` or `https://wehere-server.onrender.com`.

### 2. Point the frontend at that backend

So the **built** app on GitHub Pages uses your deployed API:

1. In the **Wehere** repo on GitHub: **Settings → Secrets and variables → Actions**.
2. Add a **repository secret**:
   - Name: **`VITE_API_URL`**
   - Value: your backend URL **with no trailing slash**, e.g. `https://wehere-api.railway.app`
3. Trigger a new deploy (push to `main` or run the “Deploy WeHere to GitHub Pages” workflow).

The workflow already passes `VITE_API_URL` into the build, so the next deployment will call your backend and Ticketmaster (and auth, events, etc.) will work on the live site.

### 3. CORS (if you get block errors)

If the browser blocks requests to your backend, the server must allow the Pages origin. In `server/src/index.ts` (or wherever CORS is set), allow your frontend origin, e.g.:

- `https://gabrielv121.github.io`
- Or your custom domain if you use one

Then redeploy the backend.

---

**Summary:** Deploy the `server/` app, set `VITE_API_URL` in GitHub Actions secrets, redeploy the frontend. After that, the online version will use your backend and Ticketmaster.
