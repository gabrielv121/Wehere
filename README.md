# WeHere — Ticket resale marketplace

A **resale marketplace**: sellers list tickets they own, buyers purchase with a guarantee. WeHere holds the money, verifies delivery, and charges **seller fees only** — no buyer fees.

## Features

- **Home** — Hero, search, featured events, quick category links
- **Events** — Search + filters: category, city, date. URL-driven (shareable links)
- **Event detail** — Resale listings from fans; filter by party size; List your tickets for sellers; interactive seat map
- **Sell tickets** — List tickets (section, row, qty, price). We hold payment; 10% seller fee.
- **Account** — My listings, My sales, Payouts (seller), plus My tickets and Purchase history
- **Auth** — Log in / Sign up (demo), persisted in localStorage

## Tech

- **Frontend:** React 19 + TypeScript + Vite, Tailwind CSS v4, React Router 7
- **Backend (optional):** Node.js + Express + TypeScript, Prisma + SQLite, JWT auth

## Run (frontend only — mock data)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Backend API (Node + Express + SQLite)

To run the app with a real database and auth:

1. **Install and set up the server**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env: set JWT_SECRET to a long random string for production
   ```

2. **Create the database and seed it**

   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

   This creates an **admin** user: `admin@wehere.com` / `password`.

3. **Start the API**

   ```bash
   npm run dev
   ```

   API runs at [http://localhost:3001](http://localhost:3001). Use the frontend with `VITE_API_URL=http://localhost:3001` (see below).

4. **Wire the frontend to the API**

   In the project root, create or edit `.env`:

   ```
   VITE_API_URL=http://localhost:3001
   ```

   Then run the frontend (`npm run dev` from the repo root). The app will use the API for auth, events, listings, and orders when `VITE_API_URL` is set.

**API overview**

| Area   | Endpoints |
|--------|-----------|
| Auth   | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/profile`, `PATCH /api/auth/seller-info` |
| Events | `GET /api/events`, `GET /api/events/:id`, `POST /api/events` (admin), `PATCH /api/events/:id` (admin), `DELETE /api/events/:id` (admin) |
| Listings | `GET /api/listings/event/:eventId`, `GET /api/listings/seller/:sellerId`, `POST /api/listings`, `GET /api/listings/:id`, `PATCH /api/listings/:id/status` |
| Orders | `POST /api/orders` (checkout), `GET /api/orders/me`, `GET /api/orders/sales`, `GET /api/orders/admin` (admin), `PATCH /api/orders/:id/status`, `PATCH /api/orders/:id/verify`, `PATCH /api/orders/:id/release-payout` |

Protected routes expect: `Authorization: Bearer <token>`.

## Build

```bash
npm run build
npm run preview
```

---

## Push to GitHub & go live

### 1. Install Git (if needed)

- Download: [git-scm.com](https://git-scm.com/download/win)
- Run the installer, then **restart your terminal** (or Cursor).

### 2. Push this project to GitHub

In a terminal (PowerShell or Command Prompt) in the project folder:

```bash
cd "c:\Users\gabri\OneDrive\WeHere"

git init
git add .
git commit -m "Initial commit: WeHere event tickets app"

git branch -M main
```

Then create the repo on GitHub:

1. Go to [github.com/new](https://github.com/new).
2. Repository name: **WeHere** (or any name you like).
3. Leave it empty (no README, no .gitignore).
4. Create repository.

Back in your terminal, add the remote and push (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/WeHere.git
git push -u origin main
```

### 3. Turn on GitHub Pages

1. On GitHub, open your repo **WeHere**.
2. Go to **Settings** → **Pages** (left sidebar).
3. Under **Build and deployment**:
   - **Source**: **GitHub Actions**.
4. After the next push (or re-run the **Deploy to GitHub Pages** workflow from the **Actions** tab), the site will be live at:

   **https://YOUR_USERNAME.github.io/WeHere/**

The repo includes a workflow (`.github/workflows/deploy.yml`) that builds the app and deploys to GitHub Pages on every push to `main`. If you used a different repo name than **WeHere**, the URL will be `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.

### Alternative: Vercel or Netlify

- **[Vercel](https://vercel.com)** — Import the GitHub repo; leave base path as `/`. Auto-deploys on push.
- **[Netlify](https://netlify.com)** — Same: connect repo, build command `npm run build`, publish directory `dist`.
