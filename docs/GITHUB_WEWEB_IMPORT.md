# GitHub push + WeWeb import instructions (Windows PowerShell)

## Push the extracted component files

Create an **empty** GitHub repo for Page 3 (do not use the Page 2 Template Builder repository). In your terminal, navigate to the extracted folder containing `package.json` and `ww-config.js`:

```powershell
cd "C:\path\to\nvent-eu-cra-tools-catalogue"
git init
git add .
git commit -m "Initial commit - nVent EU CRA Tools Catalogue"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_NEW_REPO>.git
git push -u origin main
```

Replace the sample path and repository remote with your actual values. If Git says `remote origin already exists`, use `git remote set-url origin <URL>` instead of `git remote add origin ...`.

## Import into WeWeb

1. Sign in to WeWeb and open your workspace **Dashboard**.
2. Open **Coded components** → **Import element**.
3. Select your new GitHub repository and `main` branch.
4. Complete the import build and **activate** the imported version.
5. In the WeWeb editor, open your **Page 3 — Tools** page.
6. Add the **EU CRA Hub — Tools Catalogue** coded component. Make it full-width.
7. Under component properties, enter Supabase URL and **publishable** key; enable development writes only for your isolated development project.

## Update later

Edit repository, bump `package.json` version (for example `1.0.1`), commit and push. Then activate the new version in WeWeb Coded Components dashboard.

## Precondition

Run `sql/01_tools_catalogue_drafts_and_release.sql` and optionally `sql/02_development_anon_grants_ONLY.sql` (only for no-Auth isolated development) before attempting write actions.
