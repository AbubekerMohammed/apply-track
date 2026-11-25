# ApplyTrack

**ApplyTrack** is a full-stack, multi-user job application tracker built to manage high-volume job searches from initial outreach to signed offer. It connects with Gmail and Outlook to automatically detect application confirmations and status updates, tracks daily application goals and streaks, and structures referral outreach so promising leads don't go cold.

**Live Production App:** [https://applytrack-ten-red.vercel.app](https://applytrack-ten-red.vercel.app)

---

## Core Features

### 1. Multi-User Authentication & Data Isolation
- Email/password sign-up and login, plus Google and Microsoft OAuth support via **Auth.js (NextAuth v5)**.
- Protected app routes with middleware enforcement; every application, contact, target, outreach log, and email event is strictly scoped to the logged-in user.
- Light and dark mode support across all pages.

### 2. Applications Pipeline (Table & Kanban)
- Full CRUD for job applications (company, role, location, job link, date applied, source, referral status, referrer contact, stage, salary range, and notes).
- **7 Pipeline Stages:** `Applied`, `Assessment`, `Recruiter Call`, `Interviewing`, `Offer`, `Rejected`, `Ghosted`.
- Searchable, sortable, and filterable table (filter by stage, date range, referral status, and source).
- **Drag-and-drop Kanban board** that persists stage changes and records a timestamped stage-change timeline.
- Slide-over detail panel with editable notes, stage history, and linked email events.
- **CSV Import & Export** for bulk migration or backup.

### 3. Dashboard, Daily Goals & Analytics
- Live metric cards: Total Applied, Heard Back / Response Rate %, Assessments, Recruiter Calls, Interviews, Offers, Rejections, and Ghosted.
- **Daily Goal Ring & Streak Counter:** Configurable daily application target (default: 10/day in Settings).
- **Interactive Charts (Recharts):**
  - Applications per day (last 30 days)
  - Applied-to-Offer conversion funnel
  - 12-week GitHub-style activity heatmap
  - Clicking cards, stage pills, or chart elements navigates directly to the filtered Applications list.
- **Today's Focus Panel:** Surfaces overdue follow-ups, target companies needing referrals, and pending assessments.

### 4. Gmail & Outlook Inbox Integration
- Shared email-provider interface supporting both **Gmail API** and **Microsoft Graph API** (read-only scope).
- Automatically classifies job-related emails (`application confirmation`, `assessment invite`, `recruiter outreach`, `interview invite`, `offer`, `rejection`), extracts company/role/date, and creates or updates matching applications.
- Cross-inbox deduplication when both Gmail and Outlook are connected.
- **Needs Review Queue** in Settings for low-confidence matches.
- Privacy-first storage: stores only extracted metadata and short snippets, never full email bodies.

### 5. Targets, Contacts & Referral Outreach
- **Target Companies:** Track dream companies with priority (`High`, `Medium`, `Low`), target role, job link, status (`Needs referral`, `Outreach sent`, `Referral secured`, `Applied`), visual highlighting for targets needing a referral, and an interactive 5-step per-target checklist.
- **Contacts & Outreach Log:** Store contacts with LinkedIn profile links, relationship tags, and outreach logs across channels.
- **Duplicate-Outreach Warning:** Alerts you before messaging someone you've already contacted.
- **Auto-Scheduled Follow-Ups:** Automatically schedules 7-day follow-up reminders that surface in Today's Focus.

### 6. Smart Assistant & Automation
- **AI Job Search Assistant Drawer:** Answers natural-language questions about your pipeline (e.g., *"How many did I apply to last week?"*, *"Who should I follow up with?"*, *"What is my response rate?"*).
- **30-Day Auto-Ghosting:** Automatically scans for stale applications with no response after 30 days and marks them `Ghosted`.
- **Weekly Summary Digest:** Generates an executive HTML digest of weekly application volume, stage progression, and upcoming follow-ups.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) + Lucide Icons
- **Database & ORM:** PostgreSQL (Neon in production) + Prisma 7 (`@prisma/adapter-pg`)
- **Authentication:** NextAuth / Auth.js v5 (`@auth/prisma-adapter`, JWT + Credentials + Google/Azure AD)
- **Charts:** Recharts
- **Hosting:** Vercel

---

## Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/AbubekerMohammed/apply-track.git
   cd apply-track
   npm install
   ```

2. **Configure environment variables (`.env`):**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/applytrack"
   AUTH_SECRET="your-random-secret"
   NEXTAUTH_SECRET="your-random-secret"
   AUTH_TRUST_HOST="true"

   # Optional: Google & Microsoft sign-in + Gmail/Outlook inbox sync.
   # Buttons only appear when both the ID and secret are set.
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   AZURE_AD_CLIENT_ID=""
   AZURE_AD_CLIENT_SECRET=""
   AZURE_AD_TENANT_ID="common"

   # Optional: weekly digest delivery via Resend
   RESEND_API_KEY=""
   EMAIL_FROM="ApplyTrack <digest@yourdomain.com>"

   # Required in production for the daily inbox-sync cron (vercel.json)
   CRON_SECRET=""
   # Optional: canonical public URL used in OAuth redirects and emails
   APP_URL=""
   ```

   **OAuth redirect URIs** to register (replace the host for production):
   - Google Cloud Console → OAuth client (Web):
     - `http://localhost:3000/api/auth/callback/google` (sign-in)
     - `http://localhost:3000/api/email/callback/gmail` (inbox connect; enable the Gmail API and add the `gmail.readonly` scope)
   - Microsoft Entra ID → App registration → Web platform:
     - `http://localhost:3000/api/auth/callback/microsoft-entra-id` (sign-in)
     - `http://localhost:3000/api/email/callback/outlook` (inbox connect; delegated `Mail.Read`, `User.Read`, `offline_access`)

3. **Push the Prisma schema and start the dev server:**
   ```bash
   npx prisma db push
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel + Neon)

1. Provision a PostgreSQL database (e.g., Neon via Vercel Storage) and set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, and `CRON_SECRET` in Vercel environment variables, plus the optional OAuth / Resend variables above.
2. Sync the schema to your production database:
   ```bash
   npx prisma db push
   ```
3. Deploy:
   ```bash
   npx vercel --prod
   ```

---

## Roadmap & Stretch Goals

Planned enhancements are tracked as [GitHub Issues](https://github.com/AbubekerMohammed/apply-track/issues):
- Browser Extension for 1-click job capture from LinkedIn, Greenhouse, Lever & Workday
- Resume & Cover Letter version tracking with A/B response rate analytics
- Gmail Pub/Sub / MS Graph webhooks for real-time inbox sync (a daily cron sync ships today)
- Interview Prep Hub & round-by-round notes per application
- Salary, Equity & Total Compensation offer comparison tool
- Custom pipeline stages, tags & saved filter views
- Scheduled weekly digest email delivery (Resend) & in-app notification center
- Zod API validation, rate limiting & Playwright E2E test suite
