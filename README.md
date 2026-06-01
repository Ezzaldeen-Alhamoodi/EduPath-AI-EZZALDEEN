# EduPath AI EZZALDEEN

A smart learning and scholarship coach for study planning, languages, programming, scholarship interviews, daily tasks, progress tracking, and browser notifications.

## Main Features

- Modern responsive dashboard
- Works on laptop and mobile as a PWA
- Add goals, edit goals, save goals, delete goals
- Add tasks manually
- Edit tasks
- Save task changes
- Delete tasks
- Mark tasks as done or pending
- Daily language practice planner
- Supports English, Turkish, Russian, Indonesian, Romanian, Arabic, and any custom language
- Reading, Writing, Listening, Speaking practice types
- Practice source/platform field
- Start date and end date
- Daily reminder time
- Browser notifications
- Scholarship interview coach
- English coach
- Programming debugging coach
- Smart study plan generator
- Local fallback when AI API key is missing

## Run Locally

```bash
cd edupath_ai_ezzaldeen
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Mac/Linux:

```bash
source venv/bin/activate
```

Install:

```bash
pip install -r requirements.txt
```

Create `.env`:

Windows:
```bash
copy .env.example .env
```

Mac/Linux:
```bash
cp .env.example .env
```

Run:

```bash
python run.py
```

Open:

```text
http://127.0.0.1:5000
```

## Enable AI

Add your OpenRouter key to `.env`:

```text
OPENROUTER_API_KEY=your_key_here
```

## Install on Mobile

Open the app link in Chrome, then choose:

Add to Home screen

Browser notifications need permission from the browser.

## Latest Update

- Goals now generate tasks based on the selected category.
- Mathematics goals generate mathematics-related tasks.
- Programming goals generate programming-related tasks.
- Language skills are generated only for English/Language goals.
- Tasks now support selected weekdays recurrence.
- Example: repeat a task only on Friday and Saturday.

## Mobile UI v2.0

- Improved mobile layout.
- Added fixed bottom navigation for phones.
- Improved cards, buttons, forms, spacing, and readability.

## EduPath AI v2.1

- Six-item mobile navigation.
- Dark Mode.
- Improved dashboard.
- Goal countdown and progress bars.
- Better mobile UI.


## EduPath AI v3.0 Phase 1

This release adds the first multi-user foundation.

### Added
- Register page.
- Login page.
- Logout.
- User profile page.
- Secure password hashing using Werkzeug.
- Flask-Login session management.
- User-specific goals, tasks, interview answers, and mistakes.
- Protected pages: users must log in to access private data.
- The platform name remains EduPath AI EZZALDEEN.

### Important
- Existing old data without a user_id will not appear under new accounts.
- Each new user sees only their own data.
- Keep `.env` private and never push it to GitHub.


## EduPath AI v3.1 Coach System

### Added
- New AI Coach page.
- Mobile bottom navigation changed to:
  - Home
  - Goals
  - Tasks
  - Coach
  - Code
  - Profile
- Coach page combines:
  - English Coach
  - Scholarship Coach
- Desktop navigation still keeps detailed sections.
- Better mobile organization for limited screen space.


## v3.1.1 Goals Fix

- Fixed a user-data ownership bug where newly created goals could be saved without `user_id`.
- Goals now appear correctly in Dashboard and Goals for the logged-in user.
- Goal progress is available on the Goals page.
- Coach System remains unchanged.


## EduPath AI v3.2 Public Ready

### Added
- Email verification.
- Resend verification email.
- Password reset by email token.
- PostgreSQL compatibility for Render.
- Procfile for deployment.
- Runtime file.
- `.env.example` for production setup.
- SMTP-ready email sending with safe log fallback if email is not configured.

### Render Environment Variables
Set these in Render:
- SECRET_KEY
- OPENROUTER_API_KEY
- OPENROUTER_MODEL=openrouter/auto
- DATABASE_URL from Render PostgreSQL
- MAIL_SERVER
- MAIL_PORT
- MAIL_USE_TLS
- MAIL_USERNAME
- MAIL_PASSWORD
- MAIL_DEFAULT_SENDER

### Notes
- If SMTP is not configured, verification/reset links are written to logs for development.
- For public use, configure SMTP before sharing widely.


## v3.2.1 Email Input Fix

- Fixed registration/login issues caused by invisible RTL/LTR characters when copying emails from Arabic text or messaging apps.
- Emails are now normalized and sanitized before validation.
- Improved email input fields with `inputmode=email` and autocomplete.


## v3.2.2 Email Browser Validation Fix

- Fixed strict browser email validation errors on some phones/browsers.
- Email fields now use `type=text` with `inputmode=email`, so mobile keyboards still show email layout.
- Email validation and cleanup are handled safely on the Flask server.
- Email inputs are forced left-to-right to avoid Arabic/English direction problems.


## v3.2.3 Email Security

- Removed the owner's private email from placeholders/examples.
- New accounts no longer log in automatically before email verification.
- Users must verify their email before logging in when `REQUIRE_EMAIL_VERIFICATION=true`.
- Added public resend verification page.
- If someone tries to register with someone else's email, they cannot access the account unless they own that email inbox.


## EduPath AI v3.3

### Added
- Admin Panel.
- Multiple admin emails through `ADMIN_EMAILS`.
- AI Coach access control per user.
- Daily AI limit per user.
- Admins have unlimited AI use.
- Goals and tasks remain unlimited for all users.
- Email verification is disabled by default because SMTP may not be configured.
- Dashboard version updated to v3.3.

### Environment Variables
- ADMIN_EMAILS=geni49607@gmail.com,another@example.com
- DEFAULT_AI_DAILY_LIMIT=1
- REQUIRE_EMAIL_VERIFICATION=false


## v3.3.1 Login Persistence

- Login now uses `remember=True`.
- Sessions stay active for `REMEMBER_LOGIN_DAYS` days.
- Default: 30 days.
- Added login failure logs that show whether the user exists, without exposing passwords.
- For stable accounts on Render, PostgreSQL via `DATABASE_URL` is still recommended.


## v3.3.2 PostgreSQL Startup Fix

- Fixed Render startup failure when using PostgreSQL.
- SQLite-only PRAGMA migrations are now skipped on PostgreSQL.
- PostgreSQL URL normalization is supported.
- Replaced `psycopg2-binary` with `psycopg[binary]`.
- Recommended Render setting: `REMEMBER_LOGIN_DAYS=365`.
