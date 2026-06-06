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


## v4.6.9 Smart Goals Final - No Auto Tasks

### Core rule
- User creates goals.
- User creates tasks.
- EduPath AI links completed user-created tasks to related goals.
- Goal progress increases only through related completed tasks.
- The goal system does not create tasks automatically.

### Added
- Final adaptive Smart Goals form:
  - Goal Type
  - Goal Category
  - Goal Path
  - Current State
  - Target State
  - Goal Outcome
  - Milestones
  - Daily / Weekly Commitment
  - Hidden Keywords
- Islamic Goals are Arabic-first.
- Quran goal paths and Juz Amma milestones are Arabic.
- GoalTaskLink table stores intelligent relations:
  - goal_id
  - task_id
  - match_score
  - match_reason
  - progress_added
  - is_confirmed_by_user
- When a task is marked done, the app calculates related goals and updates progress.
- Render startup stabilized with `server.py`.

Recommended Render Start Command:
```bash
gunicorn server:app
```


## v4.6.10 Smart Goals Fix

- Fixed `/goals` error: added missing `re` import.
- Removed Reminder Time from the Smart Goals form.
- Hidden linking keywords are now generated by the system and are no longer shown as a user field.
- Added adaptive custom fields for:
  - Other / Custom category
  - Other / Custom path
  - Custom current state
  - Custom target state
  - Custom commitment
- Improved cascading logic:
  - Goal Type → Goal Category → Goal Path
  - IELTS/TOEFL/Duolingo/CSCA no longer mix unrelated task structures in the same path list.
- Goal progress remains based only on user-created completed tasks.
- No automatic task creation.


## v4.6.11 Goals/Tasks Refinement

- Fixed deleting goals linked to completed tasks.
- Goal deletion now removes GoalTaskLink rows first and keeps user-created tasks safely.
- Removed Daily Minutes from Smart Goals.
- Removed Reminder Time from Smart Goals.
- Removed repeated explanatory block from Goals page.
- Hidden keywords are generated automatically by the system and are not shown to users.
- Milestones are generated adaptively and stored internally.
- Added robust Other/Custom fields for Smart Goals and Smart Tasks.
- Goal progress remains based only on user-created completed tasks.


## v4.6.12 Custom Fields + Layout Fix

- Fixed Other/Custom fields not opening in Smart Goals.
- Strengthened Other/Custom field handling in Smart Tasks.
- Removed Milestones display from user-facing goal cards.
- Removed Goal Intelligence Details display from user-facing goal cards.
- Milestones and keywords remain internal for the Goal Intelligence Engine.
- Improved layout to use two columns on larger screens and one column on narrow mobile screens.
- Preserved smart goal-task linking without automatic task creation.


## v4.6.13 Professional Smart Goals Layout

- Rebuilt the Smart Goals form layout from the template level.
- Removed the old nested/table-like adaptive fields structure.
- Goal fields now use a clean professional two-column grid on wide screens and one column on smaller screens.
- Other/Custom fields now appear as normal form fields inside the grid when selected.
- Milestones and Goal Intelligence Details remain internal and are not shown in goal cards.
- Goal intelligence continues to use hidden milestones and generated keywords internally.


## v4.6.14 Inline Custom Goal Fields

- Custom/Other fields in Smart Goals now open directly under their related dropdown.
- Islamic Goals custom fields now use Arabic labels and Arabic placeholders.
- Quran daily commitment options now include:
  - صفحة ونصف يوميًا
  - صفحتان يوميًا
- Kept milestones and keywords internal.
- Preserved goal-task linking without automatic task creation.


## v4.6.15 English Coach Saved Answers

- Added save/delete system for English Coach results.
- Added a saved answers page:
  - `/english/saved`
- Added small Saved icon in the English Coach hero.
- Users can save:
  - Quick English Improvement results
  - Essay Analysis results
  - Corrections, explanations, tips, and vocabulary
- Users can delete saved English Coach answers later.
- Expanded Quick English Improvement modes:
  - Natural
  - Simple and clear
  - Formal
  - Interview answer
  - Academic
  - Friendly
  - Concise and direct
  - Grammar correction
  - Stronger vocabulary
  - Professional email
  - IELTS style
  - TOEFL style


## v4.6.16 Smart Resources Engine

- Added a new Smart Resources page:
  - `/resources`
- Added LearningResource database model.
- Added lightweight PostgreSQL/SQLite migration for learning resources.
- Added automatic seed data for:
  - English Skills
  - English Exams
  - Chinese & HSK
  - CSCA
  - Programming & Technology
  - AI & Data Science
  - Scholarships
  - Islamic Learning
- Added search and smart filters:
  - Category
  - Exam
  - Skill
  - Resource Type
  - Official Only
  - Free Only
- Added resource cards with:
  - Official / Free badges
  - Level
  - Skill
  - Exam
  - Tags
  - Open Resource button
- Added `/api/resources/suggest` for future task/goal recommendation integration.
- Resources are static, fast, free, and do not use AI credits.


## v4.6.17 Resources Seed and Filter Fix

- Fixed empty Category / Exam / Type dropdowns in Resources.
- Resources are now seeded/updated when opening `/resources`.
- Seed is now upsert-based:
  - existing resources are kept
  - missing resources are added automatically
- Added fallback static filter options so dropdowns are never empty.
- Expanded default resources:
  - English Skills
  - IELTS / TOEFL / Duolingo English Test
  - Chinese & HSK
  - CSCA Math / Physics / Chemistry
  - Programming & Technology
  - AI & Data Science
  - Scholarships
  - Islamic Learning
- Reinforced Resources link in desktop and mobile navigation.


## v4.7.0 Big Smart Resources Database

Major expansion of the Resources Engine.

### Added
- Breaking News English.
- Much larger English skills resource set:
  - Reading
  - Listening
  - Speaking
  - Writing
  - Vocabulary
  - Grammar
  - Pronunciation
- Expanded English exam resources:
  - IELTS
  - TOEFL
  - Duolingo English Test
- Added SAT resources:
  - College Board SAT
  - Bluebook
  - Khan Academy SAT
  - SAT Suite Question Bank
  - Erica Meltzer
  - Scalar Learning
  - PrepScholar SAT
- Added ACT resources.
- Added GRE resources.
- Added GMAT resources.
- Expanded HSK and Chinese resources.
- Expanded CSCA math, physics, and chemistry resources.
- Expanded programming resources:
  - Python
  - Flask
  - SQL
  - Web Development
  - Algorithms
  - Problem Solving
- Expanded AI and data science resources.
- Expanded scholarships resources:
  - Türkiye Scholarships
  - MEXT
  - Chevening
  - Fulbright
  - Erasmus Mundus
  - Commonwealth
  - Stipendium Hungaricum
  - Study in Korea
  - Campus China
- Expanded Islamic learning resources:
  - Quran memorization
  - Quran audio
  - Tajweed
  - Tafsir
  - Hadith
  - Islamic library

### Safety
- No AI credits are used.
- Resources are seeded/upserted automatically.
- Existing resources are not deleted.
- Missing resources are added on deployment/opening Resources.


## v4.7.1 Resource Learning Paths + Keyboard Typing

- Added many more mathematics resources:
  - Arithmetic
  - Pre-Algebra
  - Algebra
  - Geometry
  - Trigonometry
  - Precalculus
  - Calculus
  - Linear Algebra
  - Statistics
  - Olympiad / problem solving
  - Math tools
- Added a new category: Keyboard Typing.
- Added typing resources:
  - TypingClub
  - Typing.com
  - Ratatype
  - Keybr
  - Monkeytype
  - TypeRacer
  - Nitro Type
  - Typing.io
  - SpeedCoder
  - KeyHero
  - 10FastFingers
- Added more CSCA physics and chemistry resources.
- Added Resource Learning Path section:
  - IELTS
  - TOEFL
  - Duolingo English Test
  - SAT
  - ACT
  - GRE
  - GMAT
  - HSK
  - CSCA
  - Mathematics
  - Keyboard Typing
  - Python / Flask
  - Scholarships
  - Quran
- Added level filter.
- Added Beginner Friendly and Advanced badges.
- Still no AI usage; resources remain static, fast, and free-first.


## v4.7.2 My Resources / Favorites

Safe zero-AI update.

### Added
- New SavedResource table:
  - user_id
  - resource_id
  - status
  - notes
  - last_opened
  - created_at
- Save / Remove buttons on every resource card.
- Save / Remove buttons on recommended learning path resources.
- New page:
  - `/my-resources`
- My Resources features:
  - filter by category
  - filter by status
  - update status
  - write personal notes
  - open resource and track last opened date
  - remove saved resource
- Navigation:
  - desktop My Resources link
  - mobile My Resources shortcut

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v4.7.3 Navigation Cleanup

Design/navigation refinement.

### Changed
- Removed Languages from desktop navigation.
- Removed Languages from mobile bottom navigation.
- Kept the old Languages route/page in code for safety, but it is no longer shown in navigation.
- Made desktop sidebar links smaller and cleaner.
- Removed emoji/icons from main navigation labels to reduce width and clutter.
- Made mobile bottom navigation more compact.
- Kept AI Coach visible in both desktop and mobile navigation.
- Removed the repeated mobile brand block by hiding the sidebar/brand area on mobile.
- Kept only the top mobile app logo visible on phones.
- Reduced bottom navigation height to improve usable screen space.

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v4.7.4 Compact Icon Navigation

Design refinement update.

### Changed
- Removed My Resources from direct desktop/mobile navigation to avoid duplication.
- My Resources remains available from the Resources page.
- Added compact colored icon boxes to the mobile bottom navigation:
  - Home
  - Goals
  - Tasks
  - Resources
  - Coach
  - More
- Reduced mobile bottom navigation clutter while keeping it readable.
- Reduced desktop sidebar width and spacing.
- Reduced oversized cards, hero sections, and some repeated large spacing.
- Kept AI Coach clearly visible in both desktop and mobile navigation.
- Kept Languages hidden from navigation.

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v4.7.5 Home Text and Arabic User Guide

- Updated dashboard hero text to match the current app direction:
  - smart goals
  - adaptive tasks
  - resources
  - My Resources
  - learning progress
- Removed outdated homepage emphasis on languages/scholarship interviews as the main wording.
- Replaced Languages quick action with Resources.
- Added Arabic User Guide page:
  - `/user-guide`
- Added User Guide link under the official app contact email in the homepage footer.
- Added copyright notice for:
  - EZZALDEEN AL-HAMOODI
  - عزالدين الحمودي
- Added Arabic usage instructions explaining:
  - Dashboard
  - Goals
  - Tasks
  - Resources
  - My Resources
  - AI Coach
  - Quran and Islamic Goals
  - daily use workflow


## v4.7.6 Smart Tasks Design and Source Links

### Task design
- Improved Task Type cards with compact colored icon boxes.
- Reduced oversized icons and labels in the task creation section.
- Made task type cards more modern and easier to scan.
- Improved saved task cards layout.
- Saved tasks now appear in two columns on wide screens and one column on smaller screens.
- Reduced vertical clutter in saved task cards.

### Arabic task sections
- Quran Memorization now displays as:
  - حفظ القرآن
- Secondary School now displays as:
  - المرحلة الثانوية
- These two task sections keep Arabic labels because they are intended for Arabic-speaking students and Quran learners.
- Added more Arabic labels for school/Quran task options.

### Source / Link intelligence
- Source text remains plain text if the user writes a book name or normal source.
- Links starting with http:// or https:// become clickable.
- Multiple links can be separated using:
  - &
- Each link is rendered separately and safely.

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v4.7.7 Full Arabic Quran and Secondary Tasks

Focused task-form update.

### Changed
- Quran Memorization task section is now fully Arabic:
  - labels
  - placeholders
  - options
  - repeat values
  - form direction
- Secondary School task section is now fully Arabic:
  - subjects
  - subfields
  - detailed topics
  - training types
  - labels and placeholders
- Fixed English remaining in the Secondary School task form such as:
  - Mathematics
  - Algebra
  - Lesson Review
  - Study Lesson
  - Task Name
  - Source / Link
  - Expected Time in Minutes
  - Repeat
  - Notes
- Kept other task sections in their normal language behavior.
- No backend database changes.

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v4.7.8 Admin Limits and Paid Codes

### Admin control
- Added compact user display in Admin page.
- Admin can control per user:
  - Free task limit
  - Free goal limit
  - Free daily AI limit
  - Paid task limit
  - Paid goal limit
  - Paid daily AI limit
  - Paid version active/inactive
  - AI enabled/disabled
  - Admin/unlimited access
- Admin sees a unique subscription code beside every user.
- Subscription code is hidden from the user.

### User limits
- Regular users are prevented from creating more tasks/goals after reaching their limits.
- Regular users receive an upgrade message when exceeding:
  - tasks limit
  - goals limit
  - AI Coach daily limit
- Admin users remain unlimited.

### Paid activation
- Every user gets a unique complex code like:
  - EDU-ABC123-XYZ789
- In Profile, users can enter the code sent by the admin.
- If correct, paid version is activated and higher limits apply.

### Safety
- Lightweight database migration only.
- Existing users get codes automatically.
- Existing data is not deleted.


## v4.7.9 Subscription Codes Expiry and Usage Status

### Subscription codes
- Added a new `SubscriptionCode` table.
- Each user now automatically gets at least 3 subscription codes.
- Each code has:
  - code
  - duration_days
  - used / available status
  - used_at date
  - created_at date
- Admin can generate additional codes for any user.
- Admin can choose code duration in days.
- Used codes are shown with a line-through in Admin.
- Available codes remain clearly visible.

### Paid version expiry
- Added `subscription_expires_at`.
- Paid version now has a real expiry date.
- When a code is activated, the user's paid version is enabled for the code duration.
- Expired subscriptions are automatically disabled when checked.

### Profile usage status
- Profile now shows:
  - goals used / limit
  - tasks used / limit
  - AI used today / daily limit
  - paid days left
  - paid expiry date

### Safety
- Backward compatible with old single subscription_code field.
- Existing users receive new multiple codes automatically.
- No existing data is deleted.


## v4.8.0 Global Subscription Code Pool

Professional subscription-code system.

### Changed from per-user codes to global code pool
- Codes are no longer pre-assigned to specific users.
- Admin generates a pool of available subscription codes.
- Any available code can be sent to any paid user.
- The code becomes linked to the user only after activation.
- Used codes cannot be used again.

### Code security
- Codes are long and generated using Python `secrets`.
- Format example:
  - EPAI-ABCDE-12345-FGHIJ-67890
- Each code can be used once only.
- Cancelled codes cannot be used.
- Used codes show as used and linked to the user who activated them.
- Activation attempts are logged.
- More than 5 failed attempts within 60 minutes blocks further activation attempts temporarily.

### Admin code pool
- Admin can generate:
  - 10 codes
  - 50 codes
  - 100 codes
  - 200 codes
- Admin chooses duration:
  - 30 days
  - 90 days
  - 180 days
  - 365 days
  - 10 years
- Admin sees:
  - available codes
  - used codes
  - cancelled codes
  - expired subscriptions
  - recent code list
- Admin can cancel unused codes.

### Paid expiry
- Subscription duration starts when the user activates the code.
- The activated code stores:
  - used_by_user_id
  - used_at
  - expires_at
- User account stores:
  - paid_active
  - paid_activated_at
  - subscription_expires_at
- Expired subscriptions automatically fall back to free plan.

### Profile activation
- User enters a code in Profile.
- If valid and unused, the paid version activates.
- If invalid, used, cancelled, or too many failed attempts, a safe error message appears.


## v4.8.1 Desktop Navigation Polish

Focused desktop UI refinement.

### Changed
- Made dark/light mode button compact on desktop.
- Made language button compact on desktop.
- Removed displayed user name and email from the desktop sidebar.
- Kept user details available inside Profile only.
- Removed duplicated Profile/Admin links from the mini user panel.
- Kept Profile in the main navigation.
- Kept Admin visible only to admin users.
- Kept Enable Reminders as the last sidebar control.
- Reduced desktop sidebar width and spacing for more workspace area.
- No database changes.

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v4.8.2 Admin Security Hardening

Security-focused update.

### Verified
- Desktop Admin link is visible only if:
  - current_user.is_admin
  - or user email is in ADMIN_EMAILS
- Mobile Admin link is visible only under the same condition.
- Every backend route beginning with `/admin` is protected by:
  - @login_required
  - @admin_required

### Hardened
- `admin_required` now returns a real 403 Forbidden for non-admin users instead of a normal redirect.
- Unauthenticated users are handled by Flask-Login unauthorized flow.
- Directly typing `/admin` or any `/admin/...` URL as a non-admin user will not grant access.

### Admin routes checked
- /admin
- /admin/send-message
- /admin/subscription-codes/generate
- /admin/subscription-codes/<id>/cancel
- /admin/user/<id>/update
- /admin/user/<id>/delete

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v4.8.3 Desktop Sidebar Icon Polish

Desktop sidebar design refinement.

### Changed
- Removed duplicated Profile from the lower/main sidebar navigation.
- Kept Profile only in the top compact user panel.
- Added colored icon cards to desktop sidebar navigation:
  - Dashboard
  - Goals
  - Tasks
  - Resources
  - AI Coach
  - Admin
- Admin remains visible only for admin accounts.
- Improved desktop sidebar spacing and visual balance.
- Matched the desktop sidebar style more closely with the mobile bottom navigation.

### AI usage
- 0 API calls.
- 0 OpenRouter usage.
- 0 cost.


## v5.1.2 Dashboard Arabic Only

Safe staged Arabic conversion.

### Scope
- Restored from clean stable v4.8.3.
- Converted only the dashboard/home page to Arabic.
- Converted dashboard navigation labels and dashboard-visible dynamic values.
- Added a small display-only dashboard Arabic filter:
  - `dashboard_ar`

### Important
- Did not modify Tasks page.
- Did not modify Goals page.
- Did not modify Resources page.
- Did not modify adaptive JavaScript logic.
- Did not modify database values.
- Did not modify task/goal adaptive IDs or fields.

This version is intended as a safe step-by-step Arabic conversion.


## v5.1.3 Dashboard Arabic Polish

Safe dashboard-only improvement.

### Scope
- Dashboard/home page only.
- Redesigned the dashboard to use desktop width better.
- Reduced oversized cards and icons.
- Improved mobile layout while keeping the bottom mobile navigation unchanged.
- Organized footer:
  - app name and version only
  - contact email
  - user guide sentence
  - copyright statement
- Translated remaining dashboard text and dashboard-visible task/goal metadata.
- Converted mobile More menu labels to Arabic:
  - Theme
  - Profile
  - Admin
  - Logout

### Safety
- Did not modify Tasks page.
- Did not modify Goals page.
- Did not modify Resources page.
- Did not modify adaptive JavaScript logic.
- Did not modify database values.
- Did not modify task/goal adaptive fields.


## v5.1.4 Dashboard Final Polish

Dashboard-only final polish.

### Fixed
- Progress card text is now visible.
- Dashboard stat labels are clearer:
  - Number of goals
  - Completed tasks
  - Remaining tasks
  - Total tasks
- Removed duplicate dashboard shortcut cards because navigation already exists in sidebar/mobile bottom nav.
- Added Arabic dashboard display labels for future visible words such as Submit, Study, Review, Practice, Homework, Exam, and Project.
- Mobile More menu labels are Arabic.

### Design
- Dashboard uses more desktop width.
- Hero section has a light blue professional background.
- Stat cards and icons are smaller and more compact.
- Footer is organized and remains simple:
  - app name + version
  - contact email
  - user guide
  - copyright

### Safety
- Dashboard only.
- No changes to Tasks, Goals, Resources adaptive logic.
- No database changes.


## v5.1.5 Dashboard Responsive Final

Dashboard-only responsive polish.

### Fixed
- Desktop dashboard now uses the available width better.
- Mobile dashboard layout repaired and compacted.
- Hero box is now clearly blue-toned, not yellow.
- Progress card text is visible in light and dark mode.
- Statistic cards are compact; numbers sit beside labels instead of far away.
- Dashboard future labels use meaning-based Arabic, for example Submit → تقديم.
- No change to Tasks, Goals, Resources, or adaptive logic.

### Safety
- Dashboard-only CSS/content changes.
- No database changes.
- No adaptive JavaScript modifications.


## v5.1.6 Dashboard Layout Fix

Dashboard-only layout fix.

### Desktop
- Fixed right sidebar overlap.
- Sidebar stays fixed on the right.
- Main content starts after sidebar using `margin-right`.
- Dashboard uses full available screen width without horizontal scroll.
- Removed the harmful desktop effect of `.main { margin: 0 !important; }` by overriding it safely.

### Hero
- Rebuilt hero as a modern blue gradient SaaS-style section.
- Text is white and readable.
- Progress card is glass-style inside the hero.

### Stats
- Stat cards are compact.
- Icon, label, and number are aligned together.

### Mobile
- Hero improved without changing the whole mobile structure.
- Main content remains full-width with bottom navigation space.

### Safety
- Dashboard/CSS/base only.
- No changes to Tasks, Goals, Resources adaptive logic.
- No database changes.


## v5.2.0 Smart Goals Arabic

### Scope
- Goals page only.
- Arabic user interface for Smart Goals.
- Preserved official names:
  - IELTS
  - TOEFL
  - Duolingo
  - HSK
  - CSCA
  - SAT
  - ACT
  - GRE
  - GMAT
  - Python
  - Flask
  - JavaScript
  - React
  - Node.js

### Adaptive Goals
- Preserved all adaptive fields:
  - Goal Type
  - Goal Category
  - Goal Path
  - Current State
  - Target State
  - Goal Outcome
  - Commitment
  - Start Date
  - Target Date
  - Notes
- Arabic labels are shown to the user.
- Internal values remain stable for logic and database safety.

### Other / Custom behavior
- Existing custom boxes remain directly under their related select:
  - category
  - path
  - current state
  - target state
  - commitment

### Intelligence
- Added hidden bilingual Arabic/English synonym expansion for goal-task linking.
- The app still does not create tasks automatically.
- Completed user-created tasks can be matched more accurately to goals.

### Safety
- No database migration.
- No task page changes.
- No resource page changes.


## v5.2.1 Full Adaptive Arabic Goals

### Goals page improvements
- Removed remaining user-facing English labels from Goals page.
- Unified visible custom option display to one Arabic word: "أخرى".
- Custom fields under goal selects are Arabic and use Arabic placeholders.
- Goal form remains adaptive:
  - Goal Type
  - Goal Category
  - Goal Path
  - Current State
  - Target State
  - Goal Outcome
  - Commitment
- Current/target/commitment now change based on the selected category/path, not only the goal type.

### Exam paths
- Added detailed official paths for:
  - IELTS
  - TOEFL
  - Duolingo
  - HSK
  - CSCA
  - SAT
  - ACT
  - GRE
  - GMAT

### Internal intelligence
- Added hidden bilingual Arabic/English synonym expansion.
- Improves task-goal linking by context, domain, skill, exam, and topic.
- No task creation is automatic.

### Safety
- No database migration.
- No changes to Tasks page.
- No changes to Resources page.
- Internal values remain stable.


## v5.2.2 Force Full Adaptive Arabic Goals

### What changed
- Added a final runtime layer dedicated to Goals page only.
- Forces Goals adaptive selects to render in Arabic where required.
- Keeps official names unchanged:
  - IELTS, TOEFL, Duolingo, HSK, CSCA, SAT, ACT, GRE, GMAT
  - Python, C, C++, Java, JavaScript, HTML, CSS, SQL, Flask, React, Node.js
  - official international question types.
- Unifies all visible Other/Custom choices as: أخرى.
- Ensures custom boxes appear below their related select and use Arabic labels/placeholders.
- Makes current state, target state, and commitment adaptive by selected category/path.
- Adds full detailed paths for IELTS, TOEFL, Duolingo, HSK, CSCA, SAT, ACT, GRE, and GMAT.
- Strengthens hidden Arabic/English goal-task linking synonyms.

### Safety
- Goals page and goal intelligence only.
- No database migration.
- No changes to Tasks page.
- No changes to Resources page.
- Internal values stay stable.


## v5.2.3 Complete Arabic Smart Goals

- Added a stronger runtime layer for Goals page.
- Removed remaining unnecessary English labels from visible goal controls.
- Unified Other/Custom display to Arabic: أخرى.
- Scholarship goal type is now Arabic and detailed.
- International exams are fully adaptive by exam.
- AI paths are Arabic while preserving technical category names.
- University categories expanded in Arabic.
- Mathematics and Daily Life categories rebuilt in natural Arabic.
- Commitment options are adaptive by domain.
- Strengthened hidden Arabic/English context matching for goals and tasks.
- No database migration.
- No task/resource page changes.


## v5.2.4 Urgent Goals Fix

### Goals page urgent fixes
- Re-added the main goal type: Education / التعليم.
- Education now includes:
  - الثانوية العامة
  - الجامعة
  - التعليم الذاتي
  - التعليم عن بعد
  - الدورات التدريبية
  - أخرى
- Secondary school now includes Arabic school subjects:
  - القرآن الكريم
  - التربية الإسلامية
  - اللغة العربية
  - اللغة الإنجليزية
  - الرياضيات
  - الفيزياء
  - الكيمياء
  - الأحياء
  - التاريخ
  - الجغرافيا
  - المجتمع
- Fixed visible Custom labels in Goals page:
  - Custom Goal Category → اكتب التصنيف
  - Custom Goal Path → اكتب المسار
  - Custom Goal State → Arabic custom labels
- Updated TOEFL with modern visible paths and 0–6 score scale.
- Improved Daily Life categories with natural Arabic labels.
- Improved University paths, especially Computer Science and AI.
- Made states and commitments more adaptive by category/path.
- Strengthened hidden goal-task intelligence for education, TOEFL, daily life, university CS, and secondary school.

### Safety
- Goals page and goal intelligence only.
- No database migration.
- No task page changes.
- No resource page changes.


## v5.2.5 Final Unified Goals

### Fixed
- Target State is saved, restored, displayed, and edited correctly.
- Goal time left no longer displays raw developer dictionaries.
- Time left now appears in Arabic, for example:
  - متبقي 164 يوماً ≈ 23 أسبوعاً ≈ 5 أشهر
- Edit Goal page now uses the same smart adaptive form as Create Goal.
- Removed the old edit form:
  - Goal name
  - Category
  - Current level
  - Daily target minutes
  - Keywords
  - Milestones
  - SMART_GOAL_INTELLIGENCE
- SMART_GOAL_INTELLIGENCE, Keywords, Relations, Tags, and Knowledge Graph stay hidden.
- User notes are separated from internal intelligence data.
- Added a hidden Knowledge Graph for IELTS, TOEFL, Flask, Python, Quran, scholarships, education, university CS, and AI.

### Safety
- No database migration.
- No task/resource page changes.
- Uses the existing goal notes field internally, but never displays it raw.


## v5.2.6 Clean Goal Cards

### Goals UX cleanup
- Removed the "معلومة مهمة" box from Edit Goal.
- Simplified goal cards.
- Goal cards now show only:
  - goal title
  - current state → target state
  - progress bar
  - progress percentage
  - remaining time
- Removed category display from compact cards.
- Removed related task count and study hours from compact cards.
- Removed raw internal/technical information from the goal card.
- Added compact Arabic time format:
  - 164 يوم • 23 أسبوع • 5 أشهر

### Safety
- No database migration.
- No task/resource changes.
- No changes to goal-saving logic.


## v5.2.7 Dashboard vs Goals Separation

### Fixed the misunderstanding
- Dashboard active goals are now compact summaries only:
  - title
  - current state → target state
  - progress bar
  - progress percentage
  - remaining time
- Goals page cards are detailed management cards and show the user's entered data:
  - title
  - goal type + category
  - goal path
  - current state → target state
  - goal outcome
  - commitment
  - start date + target date
  - progress bar
  - progress percentage
  - remaining time
  - notes only if the user wrote notes
  - edit/delete
- Empty optional fields do not reserve empty space.
- Dashboard recent task time now displays in 12-hour Arabic style, e.g. 3:30 مساءً.
- No changes to task/resource logic.


## v5.2.8 Dashboard Active Goals Fix

### Dashboard only
- Fixed active goals target state showing "غير محدد" when a target state exists.
- Current state and target state now appear on one line:
  - Band 6 → Band 8
- If the target state is genuinely missing, the arrow and missing value are hidden.
- Remaining time now appears on one line:
  - ⏳ الوقت المتبقي: 164 يوم • 23 أسبوع • 5 أشهر
- Removed approximation symbols from compact time display.
- Current Focus cards now show only:
  - goal title
  - progress bar
- No changes to detailed Goals page layout.


## v5.2.9 Native Arabic Tasks

### Tasks page
- Converted the Tasks page into a native Arabic interface.
- Arabic labels for all visible task form fields:
  - اسم المهمة
  - الفئة الرئيسية
  - الفئة الفرعية
  - الموضوع التفصيلي
  - نوع التدريب
  - المصدر أو الرابط
  - مستوى الصعوبة
  - الأولوية
  - الوقت المتوقع
  - تاريخ البدء
  - تاريخ الانتهاء
  - وقت التذكير
  - التكرار
  - ملاحظات إضافية
- Arabic placeholders with natural examples.
- Unified "Other" custom fields into Arabic labels and placeholders.
- Saved task cards now display Arabic labels and Arabic field names.
- Preserved all adaptive logic.
- Did not modify Quran Memorization or Secondary School structures.
- Official exam names, programming languages, and global technical names remain unchanged.


## v5.3.0 Deep Native Arabic Tasks

### Native Arabic language quality
- Improved literal translations into natural Arabic wording.
- Replaced weak expressions such as:
  - تدريب القواعد → حل تمارين القواعد / دراسة القواعد
  - تدريب النطق → ممارسة النطق / تحسين النطق
  - Shadowing → المحاكاة الصوتية
  - Reading Practice → فهم المقروء / قراءة تحليلية
- Preserved official exam names, programming languages, and global technical terms.

### Daily Life
- Rebuilt Daily Life as a more adaptive Arabic structure:
  - الصحة
  - الرياضة
  - النوم
  - شرب الماء
  - التغذية
  - الروتين الشخصي
  - العائلة
  - إدارة الوقت
  - إدارة المال
  - الصلاة
  - التسوق
  - ترتيب المنزل
  - تنظيف المنزل
  - القراءة
  - الاسترخاء
- Added adaptive subfields and detailed topics for health, water, sleep, prayer, personal routine, and more.

### Reading & Research
- Rebuilt Reading & Research into a richer Arabic section:
  - القراءة
  - البحث العلمي
  - الكتب
  - المقالات
  - الأبحاث
  - المراجعات
  - التلخيص
  - التفكير النقدي
  - التعلم الذاتي
- Added book fields such as CS, AI, math, philosophy, psychology, religion, tafsir, hadith, fiqh, aqeedah, literature, and more.
- Added meaningful activities:
  - قراءة
  - تلخيص
  - استخراج أفكار
  - تحليل
  - مراجعة
  - مناقشة
  - تدوين ملاحظات
  - بناء خريطة ذهنية
  - مقارنة
  - تطبيق عملي

### Safety
- Did not modify Quran Memorization structure.
- Did not modify Secondary School structure.
- Preserved all task IDs and adaptive behavior.


## v5.3.1 Deep Language Tasks

### Languages section
- Rebuilt the Languages task flow to be deeper and more adaptive.
- Language section now follows:
  - اللغة
  - المجال الثانوي
  - الموضوع التفصيلي
  - نوع النشاط
- Subfields now begin with:
  - القراءة
  - الاستماع
  - التحدث
  - الكتابة
  - الاختبارات
  - القواعد
  - المفردات
  - النطق
  - اللغة الأكاديمية
  - أخرى
- Detailed topics now change by selected subfield.
- Activity type now changes by selected detailed topic, not only by general language category.

### Examples
- القراءة → فهم الفكرة العامة → قراءة نص / تحديد الفكرة الرئيسية / تلخيص النص.
- الاستماع → فهم التفاصيل → الاستماع للمقطع / تدوين الملاحظات / الإجابة عن الأسئلة.
- التحدث → مقابلات القبول → محاكاة مقابلة / الإجابة عن أسئلة / مراجعة الإجابات.
- الكتابة → كتابة المقالات → كتابة مقال / بناء مقدمة / مراجعة الخاتمة.
- اللغة الأكاديمية → الأبحاث → قراءة بحث / تلخيص المنهجية / تحليل النتائج.

### Safety
- Only the Languages section was deepened.
- Quran Memorization and Secondary School remain unchanged.
- Official test names and official question types remain unchanged.
