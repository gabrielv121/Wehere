# WeHere — Ticket resale marketplace

A **resale marketplace**: sellers list tickets they own, buyers purchase with a guarantee. WeHere holds the money, verifies delivery, and charges **seller fees only** — no buyer fees.

## Features

- **Home** — Hero, search, featured events, quick category links
- **Events** — Search + filters: category, city, date. URL-driven (shareable links)
- **Event detail** — Resale listings from fans; filter by party size; List your tickets for sellers; interactive seat map (built-in or Seatics Maps API when configured)
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

   **Important:** Vite reads `.env` when the dev server starts. If you add or change `VITE_API_URL`, restart the frontend (`npm run dev`).

### Troubleshooting: Can't log in or sign up

- **Using the app without the backend (frontend only):** You're in *demo mode*. On the Login page, use **any email** and password **`password`** (literally the word "password"). Sign up works locally; to log in again later use password **`password`**.
- **Using the backend:** Make sure:
  1. The API is running: open a terminal, run `cd server` then `npm run dev`. You should see `WeHere API running at http://localhost:3001`. To confirm, open **http://localhost:3001/api/health** in your browser — you should see `{"ok":true,"message":"WeHere API"}`.
  2. The database exists: in the `server/` folder run `npx prisma generate && npx prisma db push` (and optionally `npx prisma db seed` for admin `admin@wehere.com` / `password`).
  3. In the **project root** `.env` either set `VITE_PROXY_API=true` (recommended: frontend proxies API requests) or `VITE_API_URL=http://localhost:3001`, then **restart the frontend** (Ctrl+C, then `npm run dev` from the project root).
- If you still see "Cannot reach API": the backend is not running or not on port 3001. Start it in a separate terminal from the `server/` folder and check http://localhost:3001/api/health.

### Stripe payments (optional)

Checkout can use **Stripe** so buyers pay by card. Without Stripe, checkout creates orders directly (no real payment).

1. **Get Stripe keys** — [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys). Use test keys for development.
2. **In `server/.env`** add:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxx
   FRONTEND_URL=http://localhost:5173
   ```
3. **Webhooks** — Stripe notifies your server when payment succeeds. For **local dev**, Stripe can’t reach localhost, so use the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/api/orders/webhook
   ```
   Copy the webhook signing secret (e.g. `whsec_...`) and add to `server/.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxx
   ```
4. Restart the backend. The checkout button becomes **Continue to payment** and redirects to Stripe; after payment, the webhook creates the order and the user is redirected to the success page.

### Seatics seat maps (optional)

Event pages can show an **interactive seat map** from the [Seatics Maps API](https://seatics.com/) (TicketNetwork) when you have a license and API credentials.

1. Get **websiteConfigId** and **consumerKey** from Seatics/TicketNetwork (sandbox first, then production after approval).
2. In the **project root** `.env` add:
   ```
   VITE_SEATICS_WEBSITE_CONFIG_ID=690
   VITE_SEATICS_CONSUMER_KEY=your_sandbox_or_production_key
   VITE_SEATICS_SANDBOX=true
   ```
3. Restart the frontend. Event detail pages will load the Seatics map (Custom UI) and display your listings on it. Event matching uses event name, venue name, and date; if Seatics has no map for that venue/date, a “No interactive map” message is shown and you can rely on the built-in SVG map instead.

**API overview**

| Area   | Endpoints |
|--------|-----------|
| Auth   | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PATCH /api/auth/profile`, `PATCH /api/auth/seller-info` |
| Events | `GET /api/events`, `GET /api/events/:id`, `POST /api/events` (admin), `PATCH /api/events/:id` (admin), `DELETE /api/events/:id` (admin) |
| Listings | `GET /api/listings/event/:eventId`, `GET /api/listings/seller/:sellerId`, `POST /api/listings`, `GET /api/listings/:id`, `PATCH /api/listings/:id/status` |
| Orders | `GET /api/orders/config`, `POST /api/orders` (checkout when no Stripe), `POST /api/orders/create-checkout-session` (Stripe), `POST /api/orders/webhook` (Stripe), `GET /api/orders/by-session/:id`, `GET /api/orders/me`, `GET /api/orders/sales`, `GET /api/orders/admin`, `PATCH /api/orders/:id/status`, etc. |

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
