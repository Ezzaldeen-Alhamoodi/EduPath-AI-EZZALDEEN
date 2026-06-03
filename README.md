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


## EduPath AI v4.0 Smart Adaptive Task System

### Added
- Adaptive task creation flow:
  - Task Type
  - Main Field
  - Sub Field
  - Detailed Topic
  - Training Type
  - Schedule / Reminder / Repeat
- Large task type coverage:
  - Secondary School
  - University
  - Languages
  - Programming & Technology
  - Artificial Intelligence
  - Mathematics
  - Scholarships
  - Daily Life
  - Projects
  - Exams & Certificates
  - Reading & Research
  - General
  - Other
- Every level includes `Other` for custom input.
- The form only shows options related to the previous choice.
- Existing database structure is preserved for PostgreSQL stability.


## REAL v4.1 Smart Goals & Exam Intelligence

This build actually updates the application files.

### Updated Tasks
- IELTS official structure:
  - Listening: Everyday Conversation, Everyday Monologue, Educational Discussion, Academic Lecture.
  - Reading: Academic Reading, General Training Reading.
  - Writing: Task 1 Academic, Task 2 Academic, Task 1 General, Task 2 General.
  - Speaking: Part 1, Part 2, Part 3.
- TOEFL official structure provided by the project owner:
  - Reading: Complete the Words, Read in Daily Life, Read an Academic Passage.
  - Listening: Listen and Choose a Response, Listen to a Conversation, Listen to an Announcement, Listen to an Academic Talk.
  - Writing: Build a Sentence, Write an Email, Write for an Academic Discussion.
  - Speaking: Listen and Repeat, Take an Interview.
- Duolingo English Test:
  - Reading, Listening, Writing, Speaking task types.
- Exam-aware task dropdowns now adapt more deeply based on the selected exam and skill.

### Updated Goals
- Smart Goals page.
- Goal progress now detects related completed tasks by shared keywords, categories, skills, exams, and task fields.
- Dashboard Current Focus v4.1 section.
- Modernized emoji labels and visual progress.


## v4.1.1 Exam Filter Fix

- Fixed IELTS / TOEFL / Duolingo / HSK filtering in both Languages and Exams & Certificates.
- Detailed Topic and Training Type now use only the selected exam and selected skill.
- Prevented mixed IELTS/TOEFL/Duolingo task lists from appearing together.


## v4.1.2 Essay Coach

- Added Essay Practice inside English Coach.
- Essay form includes:
  - Essay question/topic.
  - Student essay.
- AI result includes:
  - Corrected essay.
  - Detailed corrections with explanation and improvement guidance.
  - Writing tips for faster and stronger writing.
  - Topic vocabulary and phrases with meanings and examples.


## v4.2 UI Final Polish

- Unified visual system: blue-focused palette, softer cards, consistent radii, cleaner shadows.
- AI Coach is now the only dashboard/sidebar coach entry.
- AI Coach page contains three organized options:
  - English Coach
  - Scholarship Coach
  - Code Coach
- Removed separate English/Scholarship/Programming coach links from the main sidebar.
- Improved mobile bottom navigation.
- Version number appears only at the bottom of Dashboard.
- Updated icon style to cleaner, more modern symbols.


## v4.3 Bilingual Arabic-English

- Added Arabic / English language toggle.
- Language choice is saved in the browser.
- Arabic mode switches the interface to RTL.
- Translates main navigation, dashboard, goals, tasks, and AI Coach hub labels.
- English Coach, Scholarship Coach, and Code Coach core content remain English-focused as requested.


## v4.4 Email System & Smart Reminders

### Added
- SMTP email support using Outlook.
- Account verification emails when `REQUIRE_EMAIL_VERIFICATION=true`.
- Password reset emails.
- Welcome email after registration when verification is disabled.
- Email reminders for tasks based on each task reminder time.
- Encouragement email after completing a task.
- Lightweight cron endpoint without Celery/Redis:
  `/cron/send-task-reminders`

### Render Environment Variables

```text
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=edupath.ai.ezzaldeen.app@outlook.com
MAIL_PASSWORD=your_outlook_app_password_here
MAIL_DEFAULT_SENDER=edupath.ai.ezzaldeen.app@outlook.com
REQUIRE_EMAIL_VERIFICATION=true
CRON_SECRET=change-this-long-random-secret
APP_TIMEZONE_OFFSET_HOURS=3
EMAIL_REMINDER_WINDOW_MINUTES=15
```

### Render Cron Job

Create a Render Cron Job that calls:

```text
https://YOUR-APP.onrender.com/cron/send-task-reminders?secret=YOUR_CRON_SECRET
```

Recommended schedule:

```text
*/15 * * * *
```

This checks task reminders every 15 minutes without adding Redis/Celery cost.


## v4.5 CSCA Exam Tasks

Added CSCA to Exams & Certificates with adaptive structure:

- Exam: CSCA
- Exam Language: Chinese / English
- Subject: Mathematics / Physics / Chemistry
- Main Topic
- Detailed Topic
- Training Type

CSCA topics include:
- Mathematics: Sets and Inequalities, Functions, Geometry and Algebra, Probability and Statistics.
- Physics: Mechanics, Electromagnetism, Thermodynamics, Optics, Modern Physics.
- Chemistry: Basic Chemical Concepts and Calculations, Properties and Reactions of Substances, Chemical Theories and Laws, Chemical Experiments and Applications.

No database migration was required. CSCA values are stored using the existing task fields.


## v4.5.1 Database Migration Fix

- Fixed possible Internal Server Error after deploying v4.5.
- Added safe PostgreSQL lightweight migration for new task email columns:
  - `email_reminder_sent_at`
  - `completion_email_sent_at`
- Existing user data, tasks, and goals are preserved.


## v4.6 Final Admin Control

- Dashboard version updated to v4.6 Final Admin Control.
- Admin panel improved with:
  - Per-user goals count.
  - Per-user tasks count.
  - Completed and pending task counts.
  - Progress percentage.
  - AI usage today for English, Scholarship, Code, and General AI.
  - AI enable/disable per user.
  - Daily AI limit per regular user.
  - Admin users are unlimited.
  - Admin motivational email messaging to selected users.
- Recommended ADMIN_EMAILS:
  `geni49607@gmail.com,edupath.ai.ezzaldeen.app@outlook.com`


## v4.6.1 Email Timeout Fix

- Fixed Internal Server Error during registration/login when SMTP connection is slow or blocked.
- Added `MAIL_TIMEOUT=8`.
- Added optional `MAIL_ENABLED=true/false`.
- Email sending now fails gracefully instead of crashing the request.
- Recommended while testing email:
  - `REQUIRE_EMAIL_VERIFICATION=false`
- Enable verification only after confirming Outlook SMTP sends successfully.


## v4.6.2 Auth & In-App Notifications

### Fixed
- Registration and login no longer depend on SMTP email.
- Welcome emails, verification emails, and reset emails are disabled by default unless explicitly enabled.
- This avoids Render/Gunicorn timeout when Outlook SMTP is slow or blocked.

### Added
- In-app admin messages.
- Admin can send motivational messages from the Admin Panel.
- User sees admin messages directly on the Dashboard.
- Admin panel shows recent sent in-app messages.

### Recommended Render Environment while testing
```text
REQUIRE_EMAIL_VERIFICATION=false
MAIL_ENABLED=false
SEND_AUTH_EMAILS=false
SEND_WELCOME_EMAIL=false
SEND_ADMIN_EMAILS=false
```

Email can be re-enabled later after confirming SMTP works reliably.


## v4.6.3 Fast Toast Notifications

- Improved database connection reliability with SQLAlchemy pool pre-ping and recycling.
- Admin messages now appear as EduPath AI in-app toast notifications.
- Toast notifications appear briefly and disappear without occupying dashboard space.
- Automatic motivational notification appears after task completion.
- Admin can still send motivational notifications manually.
- Task completion email is disabled by default unless `SEND_TASK_COMPLETION_EMAILS=true`.


## v4.6.4 Mobile Dashboard Polish

- Improved mobile dashboard layout.
- Added compact mobile header:
  - dark/light mode icon
  - centered app icon
  - language switch icon
- Removed repeated dashboard subtitle/pill on mobile.
- Dashboard title appears directly above the blue hero card.
- Footer now shows only:
  - app name
  - version number
  - official contact email
- Improved spacing, hero sizing, and mobile card layout.


## v4.6.5 Quran + Mobile More Menu

- Mobile header now shows only one app icon/name at the top.
- Profile button in the bottom mobile bar was replaced by a three-dot More menu.
- More menu includes:
  - Theme toggle
  - Language toggle
  - Profile
  - Admin when available
  - Logout
- EduPath AI toast notifications now appear across all pages.
- Task completion motivation appears immediately without storing daily completion messages in the admin panel.
- Admin manual messages still appear to users as app-style toast notifications.
- Removed recent message archive from Admin to keep control panel clean.
- Added Quran Memorization as a dedicated adaptive task category in Arabic.


## v4.6.6 Full Arabic UI

- Expanded Arabic interface translation.
- Task form labels, main task categories, dynamic dropdowns, and many options now appear in Arabic when Arabic mode is enabled.
- Quran Memorization category is designed to be Arabic-first and suitable for Quran learners.
- The program name remains EduPath AI.
- AI Coach pages remain English-focused as requested.


## v4.6.6.1 Arabic Template Fix

- Fixed Jinja template error in `_task_form.html`.
- Arabic translation remains client-side only and does not affect stored task values or smart goal progress logic.
- Added safe Arabic labels for repeat options without modifying Jinja tuples.
- Keeps app performance light and avoids backend translation overhead.


## v4.6.7 Smart Adaptive Goals

- Upgraded Goals from a simple form to an adaptive smart goal system.
- Added new goal types:
  - Islamic Goals
  - Quran
  - Programming & Technology
  - Exam
  - Scholarship
  - University
  - Project
  - Daily Life
- Quran goal flow is Arabic-first:
  - تصنيف الهدف
  - مسار الهدف
  - نطاق الهدف
  - خطة المراجعة / الاستراتيجية
  - المستوى الحالي
  - الهدف المستهدف
  - الدافع
- Smart goal metadata is stored inside goal notes to avoid risky database migrations.
- Optional automatic starter tasks are created and linked to the goal.
- Progress intelligence remains based on related tasks and keywords; translation stays UI-only and does not break stored values.


## v4.6.7.1 Render Run Fix

- Fixed Render/Gunicorn startup compatibility.
- The project now supports:
  - `gunicorn run:app`
  - `gunicorn app:app`
  - `gunicorn wsgi:app`
- Recommended Render Start Command:
  `gunicorn run:app`


## v4.6.7.2 Strict Render Run Fix

- Strictly defines `app = create_app()` inside `run.py`.
- Also defines `application = app` for compatibility.
- Keeps `Procfile` as `web: gunicorn run:app`.
- Removes package-level auto app creation to avoid double startup and keep Render lighter.

Recommended Render Start Command:
```bash
gunicorn run:app
```
