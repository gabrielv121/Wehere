# Serve WeHere at the root (https://gabrielv121.github.io/)

This setup makes your app available at **https://gabrielv121.github.io/** instead of only at `/Wehere/`.

## 1. Create the user site repo (if you don’t have it)

- Repo name must be: **`gabrielv121.github.io`**
- Same GitHub account (gabrielv121)
- It can be empty (no need to copy the Wehere code)

## 2. Add the workflow

In the **gabrielv121.github.io** repo:

1. Create the folder: **`.github/workflows/`**
2. Add a file: **`.github/workflows/deploy.yml`**
3. Copy the contents of **`docs/user-site-deploy.yml`** from this (Wehere) repo into that file, and commit + push.

## 3. Turn on GitHub Pages

In the **gabrielv121.github.io** repo:

1. Go to **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Save

## 4. Run the deploy

- Push to **main** in **gabrielv121.github.io** (with the workflow in place), or  
- In **Actions**, open **“Deploy WeHere to root”** and click **Run workflow**

The workflow will:

- Check out the **Wehere** repo
- Build the app with **base path `/`**
- Deploy the built site to **https://gabrielv121.github.io/**

## If “Checkout Wehere” fails

If the workflow can’t read the Wehere repo (e.g. it’s private or token limits):

1. Create a **Personal Access Token** (Settings → Developer settings → Personal access tokens) with **repo** scope.
2. In **gabrielv121.github.io** go to **Settings → Secrets and variables → Actions**.
3. Add a secret named **`WEHERE_ACCESS_TOKEN`** with the token value.
4. In **`.github/workflows/deploy.yml`**, change the checkout step to use it:

   ```yaml
   token: ${{ secrets.WEHERE_ACCESS_TOKEN }}
   ```

Then commit, push, and run the workflow again.
