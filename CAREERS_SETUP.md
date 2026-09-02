# Careers setup — Respawn Media

Evergreen hiring destination: `https://respawnmedia.in/careers`

The homepage stays as-is. This stack is **static HTML on Vercel + Vercel Node serverless functions + Google Apps Script + Sheets/Drive**. There is no Next.js, no `package.json`, and no CI lint/test/build scripts.

Do **not** put `CAREERS_API_SECRET`, the Apps Script `/exec` URL, or resume files in client-side JavaScript or git.

---

## 1. Summary of what was added

A `/careers` page (same React 18 + Babel CDN pattern as the homepage) lists full-time, internship, and freelance roles from Google Sheets. Candidates filter in-page, expand a role, and submit a 4-step application. Resumes land in a **private** Drive folder. Every application is **one row** on `ALL_APPLICATIONS`. Role tabs are QUERY views, not duplicated databases.

The browser only talks same-origin:

- `GET /api/careers/config`
- `POST /api/careers/apply`

Vercel functions attach `CAREERS_API_SECRET` server-side and call Apps Script. Secrets never ship to the client.

---

## 2. Files created

- `careers/index.html` — careers + freelance UI
- `api/careers/config.js` — GET proxy + ~120s in-memory cache
- `api/careers/apply.js` — POST proxy, honeypot, size/type checks
- `vercel.json` — `/careers` rewrite + cache/security headers
- `google-apps-script/RespawnCareersBackend.gs`
- `google-apps-script/README.md`
- `.env.example`
- `CAREERS_SETUP.md` (this file)

## 3. Files modified

- `index.html` — Careers link in desktop nav + hamburger only
- `.gitignore` — already ignored `.env`; added `.env.production` / `.vercel`

`project/` was not touched. Netlify Function files were removed (they do not run on Vercel).

---

## 4. Environment variables (Vercel, server-only)

```
CAREERS_APPS_SCRIPT_URL=
CAREERS_API_SECRET=
```

Never name these `NEXT_PUBLIC_*` or `VITE_*`. `.env.example` has empty placeholders only. A local `.env` is gitignored.

Generate a long random secret (e.g. 32+ bytes). Use the **same** value as Apps Script property `CAREERS_API_SECRET`.

Exact Vercel dashboard clicks: **§7**.

---

## 5. Google Sheet setup

1. Spreadsheet (already created): [RESPAWN / TALENT DATABASE](https://docs.google.com/spreadsheets/d/1CEt4x_HDlQJyG4xucsBjsEUPLHBIF5PB-Oy9_36zWtY/edit)  
   **SHEET_ID:** `1CEt4x_HDlQJyG4xucsBjsEUPLHBIF5PB-Oy9_36zWtY`
2. **Share → General access → Restricted** (not anyone-with-link).
3. Resumes folder: `RESPAWN CAREERS / RESUMES`  
   **RESUME_FOLDER_ID:** `1A2m2R3LpXOcOK0zpCprFkS8ZARP7OvzQ`  
   **Share → Restricted.** If it is currently “anyone with the link can view”, change it now. Candidates never need that link.
4. Leave tabs empty until the script runs. Do not hand-build columns; `setupWorkbook()` creates:
   - `SITE_SETTINGS` (key / value)
   - `ROLES`
   - `REQUIREMENTS`
   - `QUESTIONS`
   - `ALL_APPLICATIONS`
5. After seed, you can edit rows in the Sheet. `show_on_site`, `accepting_applications`, `status`, and each requirement/question `enabled` flag control the public page **without a code change**. Re-running seed **skips** existing `role_id` / ids / setting keys.

Public rules:

| `status` | `show_on_site` | Result |
| --- | --- | --- |
| OPEN / ALWAYS_OPEN | TRUE | Shown; Apply if `accepting_applications` is TRUE |
| PAUSED | — | Hidden publicly |
| CLOSED | TRUE | May show; Apply disabled |
| any | FALSE | Hidden |

---

## 6. Google Apps Script deploy

1. Open the spreadsheet → **Extensions → Apps Script**.
2. Replace `Code.gs` with the contents of `google-apps-script/RespawnCareersBackend.gs`. Save.
   - Line 1 must **not** be `function myFunction() {`.
   - Line 1 should be the comment `Respawn Media — Careers backend`.
   - If Cursor still shows a one-line English note in that tab, **Revert File** from disk (do not Save the note).
3. **Project Settings → Script properties:**
   - `CAREERS_API_SECRET` = (same as Vercel)
   - `RESUME_FOLDER_ID` = `1A2m2R3LpXOcOK0zpCprFkS8ZARP7OvzQ`
   - `SPREADSHEET_ID` = `1CEt4x_HDlQJyG4xucsBjsEUPLHBIF5PB-Oy9_36zWtY` (optional if the script is bound to this sheet)
4. In the editor, open the function dropdown (it currently may say `myFunction`) → pick `setupWorkbook` → **Run** → authorize Sheets/Drive.  
   Then run `seedDefaultCareersData`.  
   Then run `syncRoleTabs`.  
   (Menu **Respawn Careers** appears after reload if `onOpen` ran.)
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the web app URL (`…/exec`) — this is `CAREERS_APPS_SCRIPT_URL`.
7. After later script edits: Deploy → Manage deployments → **New version**.

`doGet` / `doPost` expect the secret (`token` query on GET from Vercel; `api_secret` in POST JSON from Vercel). Custom HTTP headers are unreliable on Apps Script, so the secret is not header-only.

---

## 7. Vercel deploy (primary host) — do this when you intend to ship

This branch is **`feat/careers`**. Do not merge to `main` until you choose to.

The GitHub repo is already connected to Vercel. Careers files only exist on the branch you push. If Vercel deploys **`main`**, `/careers` and `/api/careers/*` will 404 until `feat/careers` is the production branch **or** you merge.

### 7.1 Confirm the project

1. Open [https://vercel.com](https://vercel.com) and sign in.
2. Click your **Respawn Media** project (the one imported from this GitHub repo).
3. **Settings → General → Git**: note which branch is **Production Branch** (often `main`).

To preview careers **without merging**: **Deployments** should include a deployment of `feat/careers` after you push this branch. Open that deployment’s URL (not necessarily `respawnmedia.in`).

To put careers on `respawnmedia.in`: either set Production Branch to `feat/careers` (temporary) or merge `feat/careers` into the production branch. Do not merge until you are ready.

### 7.2 Add environment variables (exact click path)

1. In the project: **Settings** (top of the project, next to **Deployments** / **Analytics**).
2. Left sidebar: **Environment Variables**.
3. Add the first variable:
   - **Key:** `CAREERS_APPS_SCRIPT_URL`
   - **Value:** the Apps Script web app URL that ends in `/exec` (from §6 step 6).  
     Example shape: `https://script.google.com/macros/s/AKfycb…/exec`
   - **Environments:** check **Production** and **Preview** (and **Development** if you use `vercel dev`).
   - Click **Save**.
4. Add the second variable the same way:
   - **Key:** `CAREERS_API_SECRET`
   - **Value:** the **identical** string you stored in Apps Script **Project Settings → Script properties → `CAREERS_API_SECRET`**.
   - **Production** + **Preview**.
   - **Save**.
5. Do **not** prefix these with `NEXT_PUBLIC_` or `VITE_`. Do not paste them into `careers/index.html`.

Existing env vars are **not** injected into a deploy that already finished. You must redeploy.

### 7.3 Redeploy after adding env vars

1. Project → **Deployments**.
2. Find the latest deployment of the branch you care about (`feat/careers` or `main`).
3. Click the **⋯** menu on that row → **Redeploy**.
4. Confirm (use the existing commit; no need to rebuild with a different branch).

Or push a new commit to that branch; Vercel will deploy again.

### 7.4 What must be on the deployed branch

These paths must exist on the Git branch Vercel builds:

- `careers/index.html`
- `api/careers/config.js`
- `api/careers/apply.js`
- `vercel.json`

If they only live on `feat/careers` and production tracks `main`, production will not have careers.

### 7.5 Test URLs

Replace `their-project` with your Vercel project slug (shown on the project page, also like `respawn-media-website.vercel.app`).

| URL | Expect |
| --- | --- |
| `https://their-project.vercel.app/careers` | Careers page (not 404) |
| `https://their-project.vercel.app/api/careers/config` | JSON `{ "ok": true, "data": { "settings", "roles", "universalQuestions" } }` |
| `https://respawnmedia.in/careers` | Same page **if** this project owns that domain **and** production includes this branch |

Custom domain: if **Settings → Domains** already lists `respawnmedia.in`, you do **not** need to change DNS. Do not edit nameservers or records unless the domain is missing from Vercel.

### 7.6 What 401 vs 404 vs 500 means

| Status | Typical cause | What to do |
| --- | --- | --- |
| **404** on `/careers` | HTML not on this deployment (wrong branch), or rewrite missing | Confirm `feat/careers` (or merged `main`) is what Vercel built; confirm `vercel.json` rewrite |
| **404** on `/api/careers/config` | `api/careers/config.js` not on this branch, or a rewrite swallowed `/api` | Same branch check; do not rewrite `/api` to a static file |
| **401** from `/api/careers/config` | Apps Script rejected the token (`unauthorized`) | `CAREERS_API_SECRET` on Vercel ≠ Script property, or you redeployed GAS without the property |
| **401** on apply | Same secret mismatch on POST (`api_secret`) | Align Vercel env with Script properties; Redeploy |
| **500 / 502 / 503** | Function crashed, Apps Script returned non-JSON, or env vars missing | **503** `config_unavailable` / `submit_failed` usually means env vars not set on this environment. **502** usually means GAS URL wrong, web app not deployed as “Anyone”, or GAS threw. Open **Deployments → that deploy → Functions** logs |

The careers UI treats a failed config fetch as an empty/offline state (it should not crash the homepage).

### 7.7 Vercel rewrites (what we configured)

```
/careers      →  /careers/index.html     (rewrite, 200 — not a redirect)
/careers/     →  /careers/index.html
/api/careers/config  →  api/careers/config.js   (Vercel default for /api)
/api/careers/apply   →  api/careers/apply.js
Static HTML from repo root (index.html, assets/, careers/)
```

There is no build command. `framework` is unset (`null`) so Vercel does not treat this as Next.js.

---

## 8. Manual configuration you must still do

- Restrict Sheet + Drive folder sharing (if still anyone-with-link).
- Paste Apps Script, set Script Properties, run setup/seed/sync, deploy web app.
- Add Vercel env vars (§7.2) and **Redeploy** (§7.3). Never commit the secret.
- Optionally edit `SITE_SETTINGS` copy, close/pause roles, add questions in the Sheet.
- No analytics library was added (live `index.html` has none). If GA4 is added later, the careers page already calls `window.gtag` when present, without sending names, emails, phones, or resumes.

**Resume size:** Apps Script accepts up to **10 MB**. Vercel request bodies on typical plans are smaller (often around **4.5 MB**). The apply function also rejects bodies over **6 MB** and resume files over **~5.5 MB**. Prefer resumes under ~5 MB.

---

## 9. Local testing checklist

There is no npm test/lint/build. Optional:

```bash
npx vercel env pull   # writes gitignored .env.local if you are logged in
npx vercel dev
```

Then:

- [ ] `http://localhost:3000/careers` loads (pretty URL)
- [ ] Homepage desktop + hamburger show **Careers** → `/careers`
- [ ] Homepage section hashes (`#clients`, `#work`, …) unchanged
- [ ] `/api/careers/config` returns roles after GAS is deployed and env is set
- [ ] Work type + department filters update the list without reload
- [ ] `/careers#video-editor` (and other slugs) expand + scroll
- [ ] Apply 4 steps preserve values; honeypot field `website` is hidden
- [ ] Bad file type / oversized file show errors
- [ ] Successful submit shows **GOT IT. WE'LL TAKE A LOOK.**
- [ ] UTM query params persist through the form (`utm_source`, etc.)
- [ ] No Sheet IDs or secrets in View Source / browser JS

Without env vars, the page should show the offline empty state, not crash.

---

## 10. Production QA checklist

- [ ] `/careers` 200, canonical `https://respawnmedia.in/careers`
- [ ] Title: Careers & Freelance Opportunities | Respawn Media Chennai
- [ ] Mobile ~390 and desktop: type readable, tap targets ~44px, no SaaS cards/gradients
- [ ] Logo is `assets/logo-white.png`, not redrawn text
- [ ] Accent is existing teal `#16C4BA` (not a second teal)
- [ ] CLOSED role cannot apply; PAUSED role absent; `show_on_site` FALSE absent
- [ ] New Sheet question with a supported type appears without a code deploy
- [ ] Application appears **once** on `ALL_APPLICATIONS`; role tab QUERY shows it
- [ ] Resume in Drive renamed `YYYY-MM-DD_candidate-name_role-id_originalfilename`, folder Restricted
- [ ] Freelancer pipeline default status `NEW`
- [ ] Backend down copy; zero openings copy **NOTHING OPEN RIGHT NOW.** plus freelance ALWAYS_OPEN if any
- [ ] Reduced motion: no essential info only in animation
- [ ] Keyboard: filters, expand, apply, form, cancel

---

## Netlify (unused)

Hosting moved to Vercel. Old `netlify.toml` headers/rewrites may still be in the repo but **Netlify Functions are gone** and will not serve `/api/careers/*`. Do not point DNS back at Netlify for this site.

---

## Final output (10 points)

1. **Summary** — Careers destination + Sheets CMS + private resumes + Vercel proxy API on `feat/careers`. Homepage design unchanged except a Careers nav link.
2. **Created** — listed in §2.
3. **Modified** — listed in §3.
4. **Env** — `CAREERS_APPS_SCRIPT_URL`, `CAREERS_API_SECRET` (Vercel, §7.2).
5. **Sheet** — §5 (Restricted sharing, script-created tabs).
6. **GAS deploy** — §6 (web app, execute as me, anyone, secret in properties).
7. **Hosting** — §7 (Vercel functions + rewrites; do not auto-merge).
8. **Manual** — §8.
9. **Local** — §9.
10. **Production QA** — §10.
