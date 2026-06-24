# Capital

A modern personal **net-worth dashboard**. Track everything you own and owe in one place — stocks, bonds, savings accounts, private pensions (**Pilonul II & III**) and loans — across multiple currencies, with live charts.

- **Big total on top** — your entire capital at a glance, with month-over-month change.
- **Multi-currency** — hold assets in **RON (LEI)** and **EUR**; everything is normalized to a base currency using **live ECB exchange rates**.
- **Finance-oriented charts** — net-worth trend, allocation donut, and currency exposure.
- **Per-asset value history** — every holding keeps a dated value history, shown as inline sparklines and in the edit dialog.
- **Manage holdings** — add / edit / delete assets and liabilities in a clean dashboard.
- **Email an Excel report** — one click generates a multi-sheet `.xlsx` and emails it to a recipient kept in server secrets.
- **Firebase Firestore + Google sign-in** — your data syncs to the cloud, isolated per user.
- **Works instantly** — runs in **local mode** (browser storage + seeded sample data) until you connect Firebase. No setup required to try it.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for charts
- [Firebase](https://firebase.google.com/) Authentication + Firestore
- [Frankfurter](https://www.frankfurter.app/) for keyless live FX rates

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

## Local mode vs. Cloud mode

| Mode      | When                                              | Where data lives             |
| --------- | ------------------------------------------------- | ---------------------------- |
| **Local** | No Firebase config, or not signed in              | Browser `localStorage`       |
| **Cloud** | Firebase configured **and** signed in with Google | Firestore (`users/{uid}/…`)  |

The header shows which mode is active.

## Connecting Firebase (optional)

1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. Add a **Web App** (`</>`) and copy the config values.
3. **Build → Authentication → Sign-in method**: enable **Google**.
4. **Build → Firestore Database**: create a database.
5. Copy `.env.local.example` to `.env.local` and fill in your values:

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

6. Restart `npm run dev`, then **Sign in** with Google.
7. Publish the included security rules so each user can only access their own data — copy [`firestore.rules`](firestore.rules) into **Firestore → Rules** and publish.

## Email an Excel report

The **Email Excel** button (in the Holdings panel) posts your portfolio to a
server route at `src/app/api/export/route.ts`, which builds a multi-sheet
`.xlsx` (Summary, Holdings, Net-worth history, Asset history) and emails it.

Configure these **server-side secrets** in `.env.local` (already gitignored):

| Variable           | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `EXPORT_EMAIL_TO`  | Recipient address — kept in secrets, never in git      |
| `SMTP_HOST`        | e.g. `smtp.gmail.com`                                   |
| `SMTP_PORT`        | `465` (SSL) or `587` (STARTTLS)                         |
| `SMTP_USER`        | SMTP username                                          |
| `SMTP_PASS`        | SMTP password — for Gmail use a 16-char **App Password**|
| `SMTP_FROM`        | From address (defaults to `SMTP_USER`)                 |

For Gmail: enable 2-Step Verification → **App passwords** → use the generated
password as `SMTP_PASS`. Restart the dev server after editing `.env.local`.

> The recipient is read **only** from `EXPORT_EMAIL_TO` on the server, so the
> endpoint can never be used to send mail to arbitrary addresses, and the
> address is masked in the UI confirmation.

## How money is calculated

- Each holding stores its own `value` and `currency` (`RON` or `EUR`).
- Amounts are converted to the **base currency (RON)** with live EUR→RON rates (falling back to a sensible offline rate).
- **Net capital = assets − liabilities**, where `loan` holdings are liabilities.
- You can switch the **display currency** (RON/EUR) in the header at any time.

## Project structure

```
src/
├─ app/                 # Next.js App Router (layout, page, providers, globals)
│  └─ api/export/       # POST route: build .xlsx + email it (server-only)
├─ components/          # Dashboard UI
│  ├─ charts/           # NetWorth / Allocation / Currency charts
│  ├─ HeroTotal.tsx     # Big total-capital number
│  ├─ SummaryCards.tsx  # Per-category cards
│  ├─ Sparkline.tsx     # Per-asset history trend line
│  ├─ ExportButton.tsx  # Email Excel report
│  ├─ AssetsPanel.tsx   # Holdings table + filters
│  └─ AssetFormModal.tsx# Add / edit form
├─ hooks/               # Auth, Currency & Capital React contexts
└─ lib/                 # Types, calculations, currency, Firebase, repositories
   ├─ export/           # Excel workbook builder (exceljs)
   ├─ email/            # SMTP sender (nodemailer)
   └─ repository/       # Cloud (Firestore) + Local (localStorage) backends
```

## Security notes

- Firestore access is locked down per-user via [`firestore.rules`](firestore.rules) — **publish them** before relying on cloud mode.
- The email-export endpoint only ever sends to the server-side `EXPORT_EMAIL_TO`; client-supplied addresses are ignored, so it can't be used as an open relay.
- Secrets (recipient, SMTP, Firebase) live in `.env.local`, which is gitignored — keep it out of version control.
- Remaining `npm audit` advisories are transitive / SSR DoS issues in the Next.js 14 line; the critical advisory is patched (`next@14.2.35`). For production, deploy behind a managed platform (e.g. Vercel) or upgrade to a newer Next.js major when convenient.