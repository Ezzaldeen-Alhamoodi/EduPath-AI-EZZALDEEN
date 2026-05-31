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
