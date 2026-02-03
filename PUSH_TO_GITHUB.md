# Push WeHere to GitHub (step-by-step)

## 1. Install Git

If you don’t have Git yet:

1. Go to **https://git-scm.com/download/win**
2. Download and run the installer (defaults are fine)
3. **Restart Cursor** (or your terminal) so it picks up Git

## 2. Open terminal in the project

In Cursor: **Terminal → New Terminal** (or `` Ctrl+` ``).

Make sure you’re in the project folder:

```powershell
cd "c:\Users\gabri\OneDrive\WeHere"
```

## 3. Initialize Git and commit

Run these one by one:

```powershell
git init
git add .
git commit -m "Initial commit: WeHere event tickets app"
git branch -M main
```

## 4. Create the repo on GitHub

1. Open **https://github.com/new**
2. **Repository name:** `WeHere` (or another name you prefer)
3. Leave **“Add a README”** and **“.gitignore”** unchecked
4. Click **Create repository**

## 5. Connect and push

GitHub will show you commands; use these (replace **YOUR_USERNAME** with your GitHub username):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/WeHere.git
git push -u origin main
```

If GitHub shows a different URL (e.g. if you used another repo name), use that URL instead.

## 6. Make the site live (GitHub Pages)

1. In your repo on GitHub, go to **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. After the workflow runs (or on the next push), the site will be at:

   **https://YOUR_USERNAME.github.io/WeHere/**

(If your repo name isn’t `WeHere`, the URL will use that name instead.)

---

**Troubleshooting**

- **“git is not recognized”** → Install Git (step 1) and restart the terminal
- **Push asks for login** → Use a [Personal Access Token](https://github.com/settings/tokens) as the password, or sign in with GitHub in the browser when prompted
- **404 on GitHub Pages** → Wait a minute after the first deploy, or check **Settings → Pages** and that the workflow ran under the **Actions** tab
