# Respawn Careers — Google Apps Script

This folder is the **Google-side** backend for `/careers`. It is **not** executed by Vercel. Copy `RespawnCareersBackend.gs` into a bound (or standalone) Apps Script project attached to the talent spreadsheet.

The live website never talks to this URL from the browser. Vercel functions (`api/careers/config.js` and `api/careers/apply.js`) call it server-side with `CAREERS_API_SECRET`.

## What the script does

| Function | Purpose |
| --- | --- |
| `setupWorkbook()` | Creates `SITE_SETTINGS`, `ROLES`, `REQUIREMENTS`, `QUESTIONS`, `ALL_APPLICATIONS` with required headers |
| `seedDefaultCareersData()` | Inserts default settings, roles, requirements, questions. Skips existing `role_id` / `question_id` / `requirement_id` / settings `key` |
| `syncRoleTabs()` | Adds a QUERY view tab per role pointing at `ALL_APPLICATIONS` (no copied rows) |
| `doGet` | Public careers JSON (site settings, visible roles, enabled requirements/questions). No applicant data |
| `doPost` | Validates secret + payload, stores resume in Drive, appends one `ALL_APPLICATIONS` row |

## Script Properties (Project Settings → Script Properties)

Set these in the Apps Script editor. Do not put production secret values in Git.

| Property | Required | Notes |
| --- | --- | --- |
| `CAREERS_API_SECRET` | Yes | Same value as Vercel env `CAREERS_API_SECRET` |
| `RESUME_FOLDER_ID` | Yes | Private folder `RESPAWN CAREERS / RESUMES` |
| `SPREADSHEET_ID` | If unbound | Spreadsheet id for `RESPAWN / TALENT DATABASE` |

## Sharing (required)

Keep the spreadsheet and the resumes folder **Restricted** (not “anyone with the link”).

- Spreadsheet: [RESPAWN / TALENT DATABASE](https://docs.google.com/spreadsheets/d/1CEt4x_HDlQJyG4xucsBjsEUPLHBIF5PB-Oy9_36zWtY/edit)
- Folder ID: `1A2m2R3LpXOcOK0zpCprFkS8ZARP7OvzQ`

Apps Script running **as you** can still write files. Candidates never need a public Drive link. Resume URLs stored in the sheet are owner/editor links.

## Deploy as Web App

1. Paste `RespawnCareersBackend.gs` into the script (Extensions → Apps Script on the Sheet, or a standalone project with `SPREADSHEET_ID`).
2. Set Script Properties.
3. Run `setupWorkbook`, then `seedDefaultCareersData`, then `syncRoleTabs` (authorize Drive + Sheets).
4. Deploy → New deployment → Type **Web app**.
5. Execute as: **Me**
6. Who has access: **Anyone** (so Vercel can POST/GET; the URL is still a secret stored only on Vercel)
7. Copy the `/exec` URL into Vercel `CAREERS_APPS_SCRIPT_URL`.

After code changes, **Manage deployments → New version** (same URL).

Full operator checklist: [`../CAREERS_SETUP.md`](../CAREERS_SETUP.md).
