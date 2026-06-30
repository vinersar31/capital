# Capital

A modern personal **net-worth dashboard**. Track everything you own and owe in one place — stocks, bonds, savings accounts, private pensions (**Pilonul II & III**) and loans — across multiple currencies, with live charts.

- **Big total on top** — your entire capital at a glance, with month-over-month change.
- **Multi-currency** — hold assets in **RON (LEI)**, **EUR** and **USD**; everything is normalized to a base currency using the **BNR official daily reference rate** (with ECB as a fallback).
- **Finance-oriented charts** — net-worth trend, allocation donut, and currency exposure.
- **Per-asset value history** — every holding keeps a dated value history, shown as inline sparklines and in the edit dialog.
- **Manage holdings** — add / edit / delete assets and liabilities in a clean dashboard.
- **Export** — **download** the report as `.xlsx` (works anywhere) or **email** it; optional **monthly auto-email**.
- **Firebase Firestore + Google sign-in** — your data syncs to the cloud, isolated per user.
- **Works instantly** — runs in **local mode** (browser storage + seeded sample data) until you connect Firebase. No setup required to try it.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for charts
- [Firebase](https://firebase.google.com/) Authentication + Firestore
- [ExcelJS](https://github.com/exceljs/exceljs) for reports, [Nodemailer](https://nodemailer.com/) for email
- [BNR](https://curs.bnr.ro/nbrfxrates.xml) official daily reference rates for EUR/RON and USD/RON (keyless [Frankfurter](https://www.frankfurter.app/) / ECB fallback)

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The app starts in **local mode** with sample data so you can explore immediately.

### Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the dev server              |
| `npm run build` | Production build                  |
| `npm run start` | Run the production build          |

## Deploy to GitHub Pages

This repo includes a workflow at [.github/workflows/deploy.yml](.github/workflows/deploy.yml) that
builds a **static export** and publishes it to GitHub Pages on every push to `main`.

1. Push the project to a GitHub repository.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The site deploys to
   `https://<user>.github.io/<repo>/`.

> **What works on Pages:** the full dashboard, charts, multi-currency, history,
> and **client-side `.xlsx` download** — all static.
>
> **What doesn't:** GitHub Pages is static-only, so the **email / monthly
> auto-email** features (which need a Node server) are automatically excluded
> from the Pages build and shown as unavailable in the UI. For full features,
> deploy on a Node host such as **[Vercel](https://vercel.com/)** (zero config —
> it keeps the API routes). The base path is detected automatically from your
> repo name via `actions/configure-pages`.

### Connect your Firebase (so the deployed site uses your data)

The Pages workflow injects your Firebase **web config** at build time from
GitHub secrets. Add these under **Settings → Secrets and variables → Actions →
New repository secret** (values come from your Firebase Web App config):

| Secret name                                | Example                     |
| ------------------------------------------ | --------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | `AIza…`                     |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `your-app.firebaseapp.com`  |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | `your-app`                  |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `your-app.appspot.com`      |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1234567890`                |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | `1:1234567890:web:abc123`   |

Then, in the Firebase Console:

1. **Authentication → Sign-in method →** enable **Google**.
2. **Authentication → Settings → Authorized domains →** add **`<user>.github.io`**
   (keep `localhost` for local dev). Google sign-in fails without this.
3. **Firestore Database →** create the database, then **Rules →** paste
   [`firestore.rules`](firestore.rules) and **Publish**.

Re-run the deploy workflow. Open the site, **Sign in with Google**, and add your
holdings — they save to `users/{your-uid}` in **your** Firestore. (These web
config values ship to the browser by design; your data is protected by the
Firestore rules + auth, not by hiding them.)

## Local mode vs. Cloud mode

| Mode      | When                                              | Where data lives             |
| --------- | ------------------------------------------------- | ---------------------------- |
| **Local** | No Firebase config (dev only)                     | Browser `localStorage` (empty) |
| **Cloud** | Firebase configured **and** signed in with Google | Firestore (`users/{uid}/…`)  |

When Firebase is configured the app **requires Google sign-in** and shows only
your Firestore data — there is **no sample/seed data**. The header shows the
active mode.

## Connecting Firebase (optional)

1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. Add a **Web App** (`</>`) and copy the config values.
3. **Build → Authentication → Sign-in method**: enable **Google**.
4. **Build → Firestore Database**: create a database.
5. Copy `.env.local.example` to `.env.local` and fill in your values.
6. Restart `npm run dev`, then **Sign in** with Google.
7. Publish the included security rules — copy [`firestore.rules`](firestore.rules) into **Firestore → Rules**.

## Export: download, email & monthly auto-email

- **Download** (Holdings panel) builds the `.xlsx` **in your browser** (ExcelJS),
  so it works everywhere — including GitHub Pages.
- **Email Excel** posts to `src/app/api/export/route.ts`, which builds the report
  server-side and emails it. Configure **server-side secrets** in `.env.local`:

  | Variable           | Description                                            |
  | ------------------ | ------------------------------------------------------ |
  | `EXPORT_EMAIL_TO`  | Recipient address — kept in secrets, never in git      |
  | `SMTP_HOST`        | e.g. `smtp.gmail.com`                                   |
  | `SMTP_PORT`        | `465` (SSL) or `587` (STARTTLS)                         |
  | `SMTP_USER`        | SMTP username                                          |
  | `SMTP_PASS`        | SMTP password — for Gmail use a 16-char **App Password**|
  | `SMTP_FROM`        | From address (defaults to `SMTP_USER`)                 |

- **Monthly auto-email** — open the **gear menu** (top bar) and toggle it on. The
  first time you open the app in a new month it emails the report automatically
  (it also offers **Send now**). State is kept in `localStorage`, so it needs no
  backend cron. Disabled in static (Pages) builds.

> The recipient is read **only** from `EXPORT_EMAIL_TO` on the server, so the
> endpoint can't be used to mail arbitrary addresses, and it's masked in the UI.

## How money is calculated

- Each holding stores its own `value` and `currency` (`RON` or `EUR`).
- Amounts are converted to the **base currency (RON)** with live EUR→RON rates (falling back to a sensible offline rate).
- **Net capital = assets − liabilities**, where `loan` holdings are liabilities.
- You can switch the **display currency** (RON/EUR) in the header at any time.

## Project structure

```
.github/workflows/     # CI: static export → GitHub Pages
src/
├─ app/                 # Next.js App Router (layout, page, providers, globals)
│  └─ api/export/       # POST: email .xlsx (server-only; excluded on Pages)
├─ components/          # Dashboard UI (cards, charts, panel, modal, buttons)
├─ hooks/               # Auth, Currency, Capital & AutoEmail contexts
└─ lib/                 # Types, calculations, currency, Firebase, repositories
   ├─ export/           # ExcelJS workbook builder (isomorphic) + body parser
   ├─ email/            # SMTP sender (nodemailer)
   └─ repository/       # Cloud (Firestore) + Local (localStorage) backends
```

## Security notes

- Firestore access is locked down per-user via [`firestore.rules`](firestore.rules) — **publish them** before relying on cloud mode.
- The email endpoint only ever sends to the server-side `EXPORT_EMAIL_TO`; client-supplied addresses are ignored, so it can't be used as an open relay.
- Secrets (recipient, SMTP, Firebase) live in `.env.local`, which is gitignored — keep it out of version control.
- Remaining `npm audit` advisories are transitive / SSR DoS issues in the Next.js 14 line; the critical advisory is patched (`next@14.2.35`).