\
import os
import json
import logging
import unicodedata
import secrets
from datetime import datetime, date, timedelta

from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from openai import OpenAI
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Mail, Message

load_dotenv(override=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = SQLAlchemy()
login_manager = LoginManager()
mail = Mail()



class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(140), nullable=False)
    email = db.Column(db.String(180), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    country = db.Column(db.String(120), nullable=True)
    major = db.Column(db.String(140), nullable=True)
    target_degree = db.Column(db.String(120), nullable=True)
    languages = db.Column(db.String(255), nullable=True)
    email_verified = db.Column(db.Boolean, nullable=False, default=False)
    verification_sent_at = db.Column(db.DateTime, nullable=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    ai_enabled = db.Column(db.Boolean, nullable=False, default=True)
    ai_daily_limit = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    goals = db.relationship("Goal", backref="owner", lazy=True)
    tasks = db.relationship("StudyTask", backref="owner", lazy=True)
    interview_answers = db.relationship("InterviewAnswer", backref="owner", lazy=True)
    mistakes = db.relationship("MistakeLog", backref="owner", lazy=True)

class AIUsage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    tool_name = db.Column(db.String(80), nullable=False, default="general")
    usage_date = db.Column(db.String(20), nullable=False, index=True)
    count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="ai_usage_records")


class AdminMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    message_type = db.Column(db.String(60), nullable=False, default="encouragement")
    title = db.Column(db.String(180), nullable=False, default="Message from EduPath AI")
    body = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", foreign_keys=[user_id], backref="admin_messages")
    admin = db.relationship("User", foreign_keys=[admin_id])



class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    title = db.Column(db.String(180), nullable=False)
    category = db.Column(db.String(80), nullable=False, default="General")
    current_level = db.Column(db.String(80), nullable=False, default="Beginner")
    daily_minutes = db.Column(db.Integer, nullable=False, default=60)
    start_date = db.Column(db.String(40), nullable=True)
    deadline = db.Column(db.String(40), nullable=True)
    reminder_time = db.Column(db.String(20), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class StudyTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    goal_id = db.Column(db.Integer, db.ForeignKey("goal.id"), nullable=True)
    title = db.Column(db.String(220), nullable=False)
    category = db.Column(db.String(80), nullable=False, default="Study")
    custom_category = db.Column(db.String(120), nullable=True)
    skill = db.Column(db.String(100), nullable=False, default="General")
    topic = db.Column(db.String(120), nullable=True)
    custom_topic = db.Column(db.String(120), nullable=True)
    custom_skill = db.Column(db.String(120), nullable=True)
    language = db.Column(db.String(80), nullable=True)
    practice_type = db.Column(db.String(80), nullable=True)
    source = db.Column(db.String(180), nullable=True)
    difficulty = db.Column(db.Integer, nullable=False, default=1)
    priority = db.Column(db.Integer, nullable=False, default=3)
    estimated_minutes = db.Column(db.Integer, nullable=False, default=30)
    start_date = db.Column(db.String(40), nullable=True)
    due_date = db.Column(db.String(40), nullable=True)
    reminder_time = db.Column(db.String(20), nullable=True)
    repeat_type = db.Column(db.String(40), nullable=False, default="daily")
    repeat_days = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(30), nullable=False, default="pending")
    review_count = db.Column(db.Integer, nullable=False, default=0)
    last_reviewed = db.Column(db.String(40), nullable=True)
    email_reminder_sent_at = db.Column(db.String(40), nullable=True)
    completion_email_sent_at = db.Column(db.String(40), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    goal = db.relationship("Goal", backref="tasks")


class InterviewAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    scholarship = db.Column(db.String(160), nullable=False)
    major = db.Column(db.String(120), nullable=False)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=True)
    score = db.Column(db.Integer, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class MistakeLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    area = db.Column(db.String(80), nullable=False, default="General")
    mistake = db.Column(db.Text, nullable=False)
    correction = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)





def sanitize_email(value):
    """Normalize user-entered emails and remove invisible RTL/LTR/control characters."""
    if not value:
        return ""

    cleaned = unicodedata.normalize("NFKC", value)

    invisible_chars = [
        "\u200e",  # left-to-right mark
        "\u200f",  # right-to-left mark
        "\u202a",  # left-to-right embedding
        "\u202b",  # right-to-left embedding
        "\u202c",  # pop directional formatting
        "\u202d",  # left-to-right override
        "\u202e",  # right-to-left override
        "\u2066",  # left-to-right isolate
        "\u2067",  # right-to-left isolate
        "\u2068",  # first strong isolate
        "\u2069",  # pop directional isolate
        "\ufeff",  # zero-width no-break space
    ]

    for char in invisible_chars:
        cleaned = cleaned.replace(char, "")

    # Remove all unicode control characters and normal spaces around/inside pasted text.
    cleaned = "".join(ch for ch in cleaned if unicodedata.category(ch)[0] != "C")
    cleaned = cleaned.strip().replace(" ", "")
    return cleaned.lower()


def generate_token(email, purpose):
    serializer = URLSafeTimedSerializer(os.environ.get("SECRET_KEY", "dev-secret-key"))
    return serializer.dumps(email, salt=f"edupath-{purpose}")

def verify_token(token, purpose, max_age=3600):
    serializer = URLSafeTimedSerializer(os.environ.get("SECRET_KEY", "dev-secret-key"))
    return serializer.loads(token, salt=f"edupath-{purpose}", max_age=max_age)

def send_email_message(subject, recipients, body):
    """Send email if SMTP is configured. Never break the user's request if SMTP fails."""
    try:
        if not current_app_mail_is_configured():
            logger.info("Email not configured. Subject: %s | Recipients: %s | Body: %s", subject, recipients, body)
            return False
        message = Message(subject=subject, recipients=recipients, body=body)
        mail.send(message)
        return True
    except BaseException:
        # Gunicorn can interrupt slow SMTP connections with SystemExit; never crash registration/login.
        logger.exception("Email sending failed or timed out")
        return False

def current_app_mail_is_configured():
    if os.environ.get("MAIL_ENABLED", "true").lower() != "true":
        return False
    return bool(os.environ.get("MAIL_SERVER") and os.environ.get("MAIL_USERNAME") and os.environ.get("MAIL_PASSWORD"))

def send_verification_email(user):
    token = generate_token(user.email, "verify-email")
    link = url_for("verify_email", token=token, _external=True)
    body = f"""Hello {user.name},

Welcome to EduPath AI EZZALDEEN.

Please verify your email by opening this link:
{link}

This link is valid for 24 hours.

If you did not create this account, ignore this email.
"""
    return send_email_message("Verify your EduPath AI email", [user.email], body)

def send_password_reset_email(user):
    token = generate_token(user.email, "reset-password")
    link = url_for("reset_password", token=token, _external=True)
    body = f"""Hello {user.name},

You requested a password reset for EduPath AI EZZALDEEN.

Reset your password using this link:
{link}

This link is valid for 1 hour.

If you did not request this, ignore this email.
"""
    return send_email_message("Reset your EduPath AI password", [user.email], body)


def send_welcome_email(user):
    body = f"""Hello {user.name},

Welcome to EduPath AI EZZALDEEN.

Your account is ready. You can now organize your goals, tasks, learning plan, and AI coaching.

Keep going step by step. Small daily progress becomes a big achievement.

EduPath AI EZZALDEEN
"""
    return send_email_message("Welcome to EduPath AI EZZALDEEN", [user.email], body)




def create_admin_message(user, admin, message_type, custom_message=""):
    presets = {
        "completed": "Congratulations! You are making real progress. Completing tasks means you are building discipline step by step.",
        "not_completed": "Do not worry if you did not complete everything today. Start again with one small task. Progress is built by returning, not by being perfect.",
        "partial": "You completed part of your work, and that matters. Now try to finish one more task and keep your momentum.",
        "encouragement": "Keep going. Your goals are closer when you continue with small daily steps.",
        "custom": custom_message or "Keep going. EduPath AI believes in your progress."
    }
    title_map = {
        "completed": "Great progress!",
        "not_completed": "A gentle reminder",
        "partial": "Keep your momentum",
        "encouragement": "You can do this",
        "custom": "EduPath AI Message"
    }
    message = AdminMessage(
        user_id=user.id,
        admin_id=admin.id if admin and getattr(admin, "is_authenticated", False) else None,
        message_type=message_type,
        title=title_map.get(message_type, "EduPath AI Message"),
        body=(custom_message if message_type == "custom" and custom_message else presets.get(message_type, presets["encouragement"])),
    )
    db.session.add(message)
    db.session.commit()
    return message


def send_admin_motivation_email(user, message_type, custom_message=""):
    presets = {
        "completed": "Congratulations! You are making real progress. Completing tasks means you are building discipline step by step.",
        "not_completed": "Do not worry if you did not complete everything today. Start again with one small task. Progress is built by returning, not by being perfect.",
        "partial": "You completed part of your work, and that matters. Now try to finish one more task and keep your momentum.",
        "encouragement": "Keep going. Your goals are closer when you continue with small daily steps.",
        "custom": custom_message or "Keep going. EduPath AI believes in your progress."
    }
    subject_map = {
        "completed": "Great progress from EduPath AI",
        "not_completed": "A gentle reminder from EduPath AI",
        "partial": "Keep your momentum going",
        "encouragement": "You can do this",
        "custom": "EduPath AI Message"
    }
    body = f"""Hello {user.name},

{presets.get(message_type, presets["encouragement"])}

Your learning journey is important. Continue step by step.

EduPath AI EZZALDEEN
"""
    return send_email_message(subject_map.get(message_type, "Message from EduPath AI"), [user.email], body)

def task_display_line(task):
    parts = [
        task.title or "Your task",
        task.category or "",
        task.topic or "",
        task.skill or "",
        task.language or "",
        task.practice_type or "",
    ]
    return " | ".join([p for p in parts if p])


def send_task_reminder_email(user, task):
    body = f"""Hello {user.name},

This is a reminder from EduPath AI EZZALDEEN.

You have a task to work on now:

{task_display_line(task)}

Expected time: {task.estimated_minutes or 30} minutes
Reminder time: {task.reminder_time or "Not set"}
Deadline: {task.due_date or "Not set"}

Start with a small step. You do not need perfect energy; you only need to begin.

EduPath AI EZZALDEEN
"""
    return send_email_message("Task reminder: " + (task.title or "EduPath AI task"), [user.email], body)


def send_task_completion_email(user, task):
    body = f"""Congratulations {user.name},

You completed a task in EduPath AI EZZALDEEN:

{task_display_line(task)}

This is real progress. Keep your momentum and continue with the next small step.

Every completed task makes your goals closer.

EduPath AI EZZALDEEN
"""
    return send_email_message("Great work! Task completed", [user.email], body)


def task_due_for_email_reminder(task, now_dt):
    if not task.reminder_time or task.status == "done":
        return False

    today_value = str(now_dt.date())
    current_time = now_dt.strftime("%H:%M")

    if task.email_reminder_sent_at == today_value:
        return False

    if task.start_date and task.start_date > today_value:
        return False

    if task.due_date and task.due_date < today_value:
        return False

    if task.repeat_type == "once" and task.due_date and task.due_date != today_value:
        return False

    if task.repeat_type == "selected_days":
        # Python Monday=0 ... Sunday=6, same as the frontend values.
        days = [d for d in (task.repeat_days or "").split(",") if d != ""]
        if str(now_dt.weekday()) not in days:
            return False

    if task.repeat_type == "weekly" and task.due_date:
        try:
            due_weekday = datetime.strptime(task.due_date, "%Y-%m-%d").weekday()
            if now_dt.weekday() != due_weekday:
                return False
        except Exception:
            pass

    # Allow a small window so Render Cron does not need to run exactly at the minute.
    try:
        reminder = datetime.strptime(task.reminder_time, "%H:%M").time()
        reminder_minutes = reminder.hour * 60 + reminder.minute
        now_minutes = now_dt.hour * 60 + now_dt.minute
        return 0 <= (now_minutes - reminder_minutes) <= int(os.environ.get("EMAIL_REMINDER_WINDOW_MINUTES", "15"))
    except Exception:
        return current_time == task.reminder_time


@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except Exception:
        return None


def is_valid_email(value):
    value = sanitize_email(value)
    if not value or value.count("@") != 1:
        return False
    local, domain = value.split("@", 1)
    if not local or not domain or "." not in domain:
        return False
    if local.startswith(".") or local.endswith(".") or ".." in local:
        return False
    if domain.startswith(".") or domain.endswith(".") or ".." in domain:
        return False
    return True



def user_is_admin(user):
    if not user or not getattr(user, "is_authenticated", False):
        return False
    admin_emails = [email.strip().lower() for email in os.environ.get("ADMIN_EMAILS", "geni49607@gmail.com,edupath.ai.ezzaldeen.app@outlook.com").split(",") if email.strip()]
    return bool(getattr(user, "is_admin", False) or getattr(user, "email", "").lower() in admin_emails)

def admin_required(view_func):
    from functools import wraps

    @wraps(view_func)
    def wrapper(*args, **kwargs):
        if not current_user.is_authenticated or not user_is_admin(current_user):
            flash("Admin access only.", "error")
            return redirect(url_for("index"))
        return view_func(*args, **kwargs)

    return wrapper

def ai_usage_status(user, tool_name="general"):
    if user_is_admin(user):
        return {"allowed": True, "used": 0, "limit": "unlimited"}

    if not getattr(user, "ai_enabled", True):
        return {"allowed": False, "used": 0, "limit": 0}

    today_value = str(date.today())
    record = AIUsage.query.filter_by(user_id=user.id, tool_name=tool_name, usage_date=today_value).first()
    used = record.count if record else 0
    limit = getattr(user, "ai_daily_limit", 1) or 1
    return {"allowed": used < limit, "used": used, "limit": limit}

def record_ai_usage(user, tool_name="general"):
    if user_is_admin(user):
        return

    today_value = str(date.today())
    record = AIUsage.query.filter_by(user_id=user.id, tool_name=tool_name, usage_date=today_value).first()
    if not record:
        record = AIUsage(user_id=user.id, tool_name=tool_name, usage_date=today_value, count=0)
        db.session.add(record)
    record.count += 1
    db.session.commit()


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")
    app.permanent_session_lifetime = timedelta(days=int(os.environ.get("REMEMBER_LOGIN_DAYS", "30")))
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL",
        "sqlite:///edupath_ai_ezzaldeen.db",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True, "pool_recycle": 280, "pool_timeout": 10}

    app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "")
    app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", "587"))
    app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    app.config["MAIL_USE_SSL"] = os.environ.get("MAIL_USE_SSL", "false").lower() == "true"
    app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "")
    app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "")
    app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER", app.config["MAIL_USERNAME"] or "noreply@edupath.ai")
    app.config["MAIL_TIMEOUT"] = int(os.environ.get("MAIL_TIMEOUT", "8"))


    db.init_app(app)
    login_manager.init_app(app)

    app.config["REQUIRE_EMAIL_VERIFICATION"] = os.environ.get("REQUIRE_EMAIL_VERIFICATION", "false").lower() == "true"
    app.config["ADMIN_EMAILS"] = [email.strip().lower() for email in os.environ.get("ADMIN_EMAILS", "geni49607@gmail.com,edupath.ai.ezzaldeen.app@outlook.com").split(",") if email.strip()]
    app.config["DEFAULT_AI_DAILY_LIMIT"] = int(os.environ.get("DEFAULT_AI_DAILY_LIMIT", "1"))

    mail.init_app(app)
    login_manager.login_view = "login"
    login_manager.login_message = "Please log in to access EduPath AI."

    with app.app_context():
        db.create_all()
        ensure_database_columns()

    ai_client = build_ai_client()

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if current_user.is_authenticated:
            return redirect(url_for("index"))

        if request.method == "POST":
            name = request.form.get("name", "").strip()
            email = sanitize_email(request.form.get("email", ""))
            password = request.form.get("password", "")
            confirm_password = request.form.get("confirm_password", "")
            country = request.form.get("country", "").strip()
            major = request.form.get("major", "").strip()
            target_degree = request.form.get("target_degree", "").strip()
            languages = request.form.get("languages", "").strip()

            if not name or not email or not password:
                flash("Name, email, and password are required.", "error")
                return redirect(url_for("register"))

            if not is_valid_email(email):
                flash("Please enter a valid email address.", "error")
                return redirect(url_for("register"))

            if password != confirm_password:
                flash("Passwords do not match.", "error")
                return redirect(url_for("register"))

            if len(password) < 6:
                flash("Password must be at least 6 characters.", "error")
                return redirect(url_for("register"))

            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                flash("This email already has an account. Please log in.", "error")
                return redirect(url_for("login"))

            user = User(
                name=name,
                email=email,
                password_hash=generate_password_hash(password),
                country=country,
                major=major,
                target_degree=target_degree,
                languages=languages,
                is_admin=email in app.config["ADMIN_EMAILS"],
                ai_enabled=True,
                ai_daily_limit=app.config["DEFAULT_AI_DAILY_LIMIT"],
                email_verified=not app.config.get("REQUIRE_EMAIL_VERIFICATION", False),
            )
            db.session.add(user)
            db.session.commit()

            if app.config.get("REQUIRE_EMAIL_VERIFICATION", False):
                if os.environ.get("SEND_AUTH_EMAILS", "false").lower() == "true" and send_verification_email(user):
                    flash("Account created. Please check your email to verify your account before logging in.", "success")
                else:
                    flash("Account created. Email verification is enabled, but sending email is currently disabled or unavailable. Please contact the admin.", "error")
                return redirect(url_for("login"))

            send_welcome_email(user) if os.environ.get("SEND_WELCOME_EMAIL", "false").lower() == "true" else False
            session.permanent = True
            login_user(user, remember=True, duration=timedelta(days=int(os.environ.get("REMEMBER_LOGIN_DAYS", "30"))))
            flash("Account created successfully. Welcome to EduPath AI EZZALDEEN.", "success")
            return redirect(url_for("index"))

        return render_template("register.html")

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for("index"))

        if request.method == "POST":
            email = sanitize_email(request.form.get("email", ""))
            password = request.form.get("password", "")

            user = User.query.filter_by(email=email).first()
            if not user or not check_password_hash(user.password_hash, password):
                logger.info("Login failed for email=%s user_exists=%s", email, bool(user))
                flash("Invalid email or password.", "error")
                return redirect(url_for("login"))

            if app.config.get("REQUIRE_EMAIL_VERIFICATION", False) and not user.email_verified:
                if os.environ.get("SEND_AUTH_EMAILS", "false").lower() == "true" and send_verification_email(user):
                    flash("Please verify your email before logging in. A verification link has been sent.", "error")
                else:
                    flash("Your email is not verified, and the verification email could not be sent now. Please contact the admin.", "error")
                return redirect(url_for("login"))

            if email in app.config["ADMIN_EMAILS"] and not user.is_admin:
                user.is_admin = True
                db.session.commit()

            session.permanent = True
            login_user(user, remember=True, duration=timedelta(days=int(os.environ.get("REMEMBER_LOGIN_DAYS", "30"))))
            flash("Welcome back.", "success")
            return redirect(url_for("index"))

        return render_template("login.html")


    @app.route("/verify-email/<token>")
    def verify_email(token):
        try:
            email = verify_token(token, "verify-email", max_age=86400)
        except SignatureExpired:
            flash("Verification link expired. Please request a new one.", "error")
            return redirect(url_for("resend_verification"))
        except BadSignature:
            flash("Invalid verification link.", "error")
            return redirect(url_for("login"))

        user = User.query.filter_by(email=email).first()
        if not user:
            flash("Account not found.", "error")
            return redirect(url_for("register"))

        user.email_verified = True
        db.session.commit()
        flash("Email verified successfully.", "success")
        return redirect(url_for("index" if current_user.is_authenticated else "login"))

    @app.route("/resend-verification", methods=["GET", "POST"])
    @login_required
    def resend_verification():
        if current_user.email_verified:
            flash("Your email is already verified.", "success")
            return redirect(url_for("profile"))

        if request.method == "POST":
            send_verification_email(current_user)
            current_user.verification_sent_at = datetime.utcnow()
            db.session.commit()
            flash("Verification email sent. Check your inbox or app logs if SMTP is not configured.", "success")
            return redirect(url_for("profile"))

        return render_template("resend_verification.html")


    @app.route("/resend-verification-public", methods=["GET", "POST"])
    def resend_verification_public():
        if current_user.is_authenticated:
            return redirect(url_for("resend_verification"))

        if request.method == "POST":
            email = sanitize_email(request.form.get("email", ""))
            user = User.query.filter_by(email=email).first()

            if user and not user.email_verified:
                send_verification_email(user)

            flash("If this email has an unverified account, a verification link has been sent.", "success")
            return redirect(url_for("login"))

        return render_template("resend_verification_public.html")


    @app.route("/forgot-password", methods=["GET", "POST"])
    def forgot_password():
        if current_user.is_authenticated:
            return redirect(url_for("profile"))

        if request.method == "POST":
            email = sanitize_email(request.form.get("email", ""))
            user = User.query.filter_by(email=email).first()
            if user and os.environ.get("SEND_AUTH_EMAILS", "false").lower() == "true":
                send_password_reset_email(user)
            flash("If this email exists and email sending is enabled, a password reset link has been sent.", "success")
            return redirect(url_for("login"))

        return render_template("forgot_password.html")

    @app.route("/reset-password/<token>", methods=["GET", "POST"])
    def reset_password(token):
        try:
            email = verify_token(token, "reset-password", max_age=3600)
        except SignatureExpired:
            flash("Password reset link expired.", "error")
            return redirect(url_for("forgot_password"))
        except BadSignature:
            flash("Invalid password reset link.", "error")
            return redirect(url_for("forgot_password"))

        user = User.query.filter_by(email=email).first_or_404()

        if request.method == "POST":
            password = request.form.get("password", "")
            confirm_password = request.form.get("confirm_password", "")

            if len(password) < 6:
                flash("Password must be at least 6 characters.", "error")
                return redirect(url_for("reset_password", token=token))

            if password != confirm_password:
                flash("Passwords do not match.", "error")
                return redirect(url_for("reset_password", token=token))

            user.password_hash = generate_password_hash(password)
            db.session.commit()
            flash("Password updated successfully. Please log in.", "success")
            return redirect(url_for("login"))

        return render_template("reset_password.html", token=token)


    @app.route("/logout")
    @login_required
    def logout():
        logout_user()
        flash("You have been logged out.", "success")
        return redirect(url_for("login"))

    @app.route("/profile", methods=["GET", "POST"])
    @login_required
    def profile():
        if request.method == "POST":
            current_user.name = request.form.get("name", current_user.name).strip()
            current_user.country = request.form.get("country", "").strip()
            current_user.major = request.form.get("major", "").strip()
            current_user.target_degree = request.form.get("target_degree", "").strip()
            current_user.languages = request.form.get("languages", "").strip()
            db.session.commit()
            flash("Profile updated.", "success")
            return redirect(url_for("profile"))

        total_goals = Goal.query.filter_by(user_id=current_user.id).count()
        total_tasks = StudyTask.query.filter_by(user_id=current_user.id).count()
        completed_tasks = StudyTask.query.filter_by(user_id=current_user.id, status="done").count()
        return render_template(
            "profile.html",
            total_goals=total_goals,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
        )






    @app.route("/cron/send-task-reminders")
    def cron_send_task_reminders():
        cron_secret = os.environ.get("CRON_SECRET", "")
        provided = request.headers.get("X-Cron-Secret") or request.args.get("secret", "")

        if cron_secret and not secrets.compare_digest(provided, cron_secret):
            return jsonify({"ok": False, "error": "unauthorized"}), 401

        now_dt = datetime.utcnow() + timedelta(hours=int(os.environ.get("APP_TIMEZONE_OFFSET_HOURS", "3")))
        sent = 0
        checked = 0

        tasks = StudyTask.query.filter(StudyTask.status != "done").all()
        for task in tasks:
            checked += 1
            if not task.user or not task.user.email:
                continue

            if task_due_for_email_reminder(task, now_dt):
                if send_task_reminder_email(task.user, task):
                    task.email_reminder_sent_at = str(now_dt.date())
                    sent += 1

        db.session.commit()
        return jsonify({"ok": True, "checked": checked, "sent": sent, "now": now_dt.isoformat()})



    @app.route("/message/<int:message_id>/read")
    @login_required
    def mark_admin_message_read(message_id):
        message = AdminMessage.query.filter_by(id=message_id, user_id=current_user.id).first_or_404()
        message.is_read = True
        db.session.commit()
        return redirect(url_for("index"))


    @app.route("/admin")
    @login_required
    @admin_required
    def admin_dashboard():
        users = User.query.order_by(User.id.desc()).all()
        total_users = User.query.count()
        total_goals = Goal.query.count()
        total_tasks = StudyTask.query.count()
        completed_tasks = StudyTask.query.filter_by(status="done").count()
        pending_tasks = StudyTask.query.filter(StudyTask.status != "done").count()
        today_value = str(date.today())
        ai_today = db.session.query(db.func.sum(AIUsage.count)).filter_by(usage_date=today_value).scalar() or 0

        recent_admin_messages = AdminMessage.query.order_by(AdminMessage.id.desc()).limit(10).all()

        user_stats = []
        for user in users:
            goals_count = Goal.query.filter_by(user_id=user.id).count()
            tasks_count = StudyTask.query.filter_by(user_id=user.id).count()
            done_count = StudyTask.query.filter_by(user_id=user.id, status="done").count()
            pending_count = StudyTask.query.filter(StudyTask.user_id == user.id, StudyTask.status != "done").count()

            usage_rows = AIUsage.query.filter_by(user_id=user.id, usage_date=today_value).all()
            usage_map = {row.tool_name: row.count for row in usage_rows}

            user_stats.append({
                "user": user,
                "goals_count": goals_count,
                "tasks_count": tasks_count,
                "done_count": done_count,
                "pending_count": pending_count,
                "progress": int((done_count / tasks_count) * 100) if tasks_count else 0,
                "english_used": usage_map.get("english", 0),
                "scholarship_used": usage_map.get("scholarship", 0),
                "code_used": usage_map.get("code", 0),
                "general_used": usage_map.get("general", 0),
                "is_unlimited": user_is_admin(user),
            })

        return render_template(
            "admin.html",
            users=users,
            user_stats=user_stats,
            total_users=total_users,
            total_goals=total_goals,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            ai_today=ai_today,
            recent_admin_messages=recent_admin_messages,
        )


    @app.route("/admin/send-message", methods=["POST"])
    @login_required
    @admin_required
    def admin_send_message():
        user_id = int(request.form.get("user_id", 0) or 0)
        message_type = request.form.get("message_type", "encouragement").strip()
        custom_message = request.form.get("custom_message", "").strip()

        user = User.query.get_or_404(user_id)
        create_admin_message(user, current_user, message_type, custom_message)

        email_sent = False
        if os.environ.get("SEND_ADMIN_EMAILS", "false").lower() == "true":
            email_sent = send_admin_motivation_email(user, message_type, custom_message)

        if email_sent:
            flash("In-app message created and email sent successfully.", "success")
        else:
            flash("In-app message created successfully. Email sending is disabled or unavailable.", "success")

        return redirect(url_for("admin_dashboard"))


    @app.route("/admin/user/<int:user_id>/update", methods=["POST"])
    @login_required
    @admin_required
    def admin_update_user(user_id):
        user = User.query.get_or_404(user_id)

        # Do not allow accidentally removing your own admin access by mistake.
        if user.id != current_user.id:
            user.is_admin = request.form.get("is_admin") == "on"

        user.ai_enabled = request.form.get("ai_enabled") == "on"
        user.ai_daily_limit = int(request.form.get("ai_daily_limit", 1) or 1)
        user.name = request.form.get("name", user.name).strip() or user.name
        db.session.commit()
        flash("User updated.", "success")
        return redirect(url_for("admin_dashboard"))

    @app.route("/admin/user/<int:user_id>/delete", methods=["POST"])
    @login_required
    @admin_required
    def admin_delete_user(user_id):
        user = User.query.get_or_404(user_id)
        if user.id == current_user.id:
            flash("You cannot delete your own admin account.", "error")
            return redirect(url_for("admin_dashboard"))

        Goal.query.filter_by(user_id=user.id).delete()
        StudyTask.query.filter_by(user_id=user.id).delete()
        InterviewAnswer.query.filter_by(user_id=user.id).delete()
        MistakeLog.query.filter_by(user_id=user.id).delete()
        AIUsage.query.filter_by(user_id=user.id).delete()
        db.session.delete(user)
        db.session.commit()
        flash("User and related data deleted.", "success")
        return redirect(url_for("admin_dashboard"))


    @app.route("/coach")
    @login_required
    def coach():
        recent_answers = InterviewAnswer.query.filter_by(user_id=current_user.id).order_by(InterviewAnswer.id.desc()).limit(5).all()
        return render_template(
            "coach.html",
            recent_answers=recent_answers,
            english_ai=ai_usage_status(current_user, "english"),
            scholarship_ai=ai_usage_status(current_user, "scholarship"),
            code_ai=ai_usage_status(current_user, "code"),
        )


    @app.context_processor
    def inject_toast_notifications():
        toast_notifications = session.pop("toast_notifications", []) if current_user.is_authenticated else []
        if current_user.is_authenticated:
            try:
                unread = AdminMessage.query.filter_by(user_id=current_user.id, is_read=False).order_by(AdminMessage.id.desc()).limit(5).all()
                for message in unread:
                    toast_notifications.append({"title": message.title, "body": message.body})
                    message.is_read = True
                if unread:
                    db.session.commit()
            except Exception:
                logger.exception("Failed to load toast notifications")
        return {"toast_notifications": toast_notifications}


    @app.route("/")
    @login_required
    def index():
        goals = Goal.query.filter_by(user_id=current_user.id).order_by(Goal.id.desc()).limit(6).all()
        for goal in goals:
            goal.time_left = calculate_goal_time_left(goal.deadline)
            goal.goal_progress = calculate_goal_progress(goal)
        tasks = StudyTask.query.filter_by(user_id=current_user.id).order_by(StudyTask.id.desc()).limit(10).all()
        mistakes = MistakeLog.query.filter_by(user_id=current_user.id).order_by(MistakeLog.id.desc()).limit(6).all()

        total_tasks = StudyTask.query.filter_by(user_id=current_user.id).count()
        completed_tasks = StudyTask.query.filter_by(user_id=current_user.id, status="done").count()
        pending_tasks = StudyTask.query.filter_by(user_id=current_user.id, status="pending").count()
        total_goals = Goal.query.filter_by(user_id=current_user.id).count()
        progress = int((completed_tasks / total_tasks) * 100) if total_tasks else 0

        weak_skills = detect_weaknesses()
        admin_messages = []
        unread_admin_messages = 0

        return render_template(
            "index.html",
            goals=goals,
            tasks=tasks,
            mistakes=mistakes,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            pending_tasks=pending_tasks,
            total_goals=total_goals,
            progress=progress,
            weak_skills=weak_skills,
            admin_messages=admin_messages,
            unread_admin_messages=unread_admin_messages,
        )


def build_goal_metadata_from_form(form):
    fields = {
        "Goal Field": form.get("goal_field", "").strip(),
        "Goal Path": form.get("goal_path", "").strip(),
        "Goal Scope": form.get("goal_scope", "").strip(),
        "Goal Strategy": form.get("goal_strategy", "").strip(),
        "Current State": form.get("current_state_select", "").strip(),
        "Target Outcome": form.get("target_outcome_select", "").strip() or form.get("goal_outcome", "").strip(),
        "Motivation": form.get("goal_motivation", "").strip(),
        "Extra Notes": form.get("notes", "").strip(),
    }
    lines = ["SMART_GOAL_PLAN"]
    for key, value in fields.items():
        if value:
            lines.append(f"{key}: {value}")
    return "\n".join(lines)


def create_starter_tasks_for_goal(goal, form):
    """Create a small starter plan without heavy AI or extra cost."""
    goal_type = goal.category
    field = form.get("goal_field", "").strip()
    path = form.get("goal_path", "").strip()
    scope = form.get("goal_scope", "").strip()
    strategy = form.get("goal_strategy", "").strip()
    daily_minutes = goal.daily_minutes or 30

    tasks_to_create = []

    if goal_type in ["Quran", "Islamic Goals"] or field == "القرآن الكريم":
        target = scope or path or goal.title
        tasks_to_create = [
            ("حفظ جديد: " + target, "حفظ", "حفظ جديد", "تثبيت الحفظ"),
            ("مراجعة محفوظ الأمس", "مراجعة", "مراجعة يومية", "مراجعة"),
            ("تسميع بدون مصحف", "تسميع", "تسميع ذاتي", "تصحيح الأخطاء"),
            ("مراجعة أسبوعية للتثبيت", "مراجعة", "مراجعة أسبوعية", "مراجعة متباعدة"),
        ]
        category = "Quran Memorization"
    elif goal_type in ["Language", "Exam"]:
        target = path or field or goal.title
        tasks_to_create = [
            (f"Practice {target} Reading", "Reading", target, "Practice"),
            (f"Practice {target} Listening", "Listening", target, "Practice"),
            (f"Write one {target} response", "Writing", target, "Timed Practice"),
            (f"Review mistakes for {target}", "Mistake Review", target, "Review Mistakes"),
        ]
        category = "Languages" if goal_type == "Language" else "Exams & Certificates"
    elif goal_type == "Programming & Technology":
        target = path or field or goal.title
        tasks_to_create = [
            (f"Study {target} concept", "Study Concept", target, "Study Concept"),
            (f"Solve {target} exercises", "Problem Solving", target, "Solve Exercises"),
            (f"Build mini project with {target}", "Projects", target, "Build Mini Project"),
            (f"Review {target} mistakes", "Debugging", target, "Review Mistakes"),
        ]
        category = "Programming & Technology"
    elif goal_type == "Scholarship":
        target = path or field or goal.title
        tasks_to_create = [
            (f"Check {target} requirements", "Requirements", target, "Search"),
            (f"Prepare documents for {target}", "Documents", target, "Prepare"),
            (f"Edit application text for {target}", "Motivation Letter", target, "Edit"),
            (f"Final review for {target}", "Final Check", target, "Review"),
        ]
        category = "Scholarships"
    else:
        target = path or field or goal.title
        tasks_to_create = [
            (f"Plan first step for {target}", "Planning", target, "Prepare"),
            (f"Work on {target}", "Practice", target, "Do Task"),
            (f"Review progress for {target}", "Review", target, "Review Progress"),
        ]
        category = goal_type if goal_type else "General"

    for title, skill, topic, practice_type in tasks_to_create:
        db.session.add(StudyTask(
            user_id=goal.user_id,
            goal_id=goal.id,
            title=title,
            category=category,
            topic=topic,
            skill=skill,
            language=scope or path,
            practice_type=practice_type,
            estimated_minutes=max(15, min(int(daily_minutes), 120)),
            priority=4,
            difficulty=2,
            start_date=goal.start_date,
            due_date=goal.deadline,
            reminder_time=goal.reminder_time,
            repeat_type="daily",
            notes=f"Auto-created from smart goal: {goal.title}",
        ))
    db.session.commit()


    @app.route("/goals", methods=["GET", "POST"])
    @login_required
    def goals():
        if request.method == "POST":
            goal_notes = build_goal_metadata_from_form(request.form)
            selected_current_state = request.form.get("current_state_select", "").strip()
            typed_current_level = request.form.get("current_level", "").strip()
            selected_outcome = request.form.get("target_outcome_select", "").strip()
            typed_outcome = request.form.get("goal_outcome", "").strip()

            goal = Goal(
                user_id=current_user.id,
                title=request.form.get("title", "").strip(),
                category=request.form.get("category", "General").strip(),
                current_level=typed_current_level or selected_current_state or "Beginner",
                daily_minutes=int(request.form.get("daily_minutes", 60) or 60),
                start_date=request.form.get("start_date", "").strip(),
                deadline=request.form.get("deadline", "").strip(),
                reminder_time=request.form.get("reminder_time", "").strip(),
                notes=goal_notes + ("\nGoal Outcome: " + (typed_outcome or selected_outcome) if (typed_outcome or selected_outcome) else ""),
            )

            if not goal.title:
                flash("Goal title is required.", "error")
                return redirect(url_for("goals"))

            db.session.add(goal)
            db.session.commit()

            if request.form.get("auto_create_tasks") == "yes":
                create_starter_tasks_for_goal(goal, request.form)
                flash("Smart goal saved and starter tasks were created automatically.", "success")
            else:
                flash("Smart goal saved. Add related tasks manually from the Tasks page.", "success")
            return redirect(url_for("goals"))

        all_goals = Goal.query.filter_by(user_id=current_user.id).order_by(Goal.id.desc()).all()
        for goal in all_goals:
            goal.time_left = calculate_goal_time_left(goal.deadline)
            goal.goal_progress = calculate_goal_progress(goal)
        return render_template("goals.html", goals=all_goals)

    @app.route("/goal/<int:goal_id>/edit", methods=["GET", "POST"])
    @login_required
    def edit_goal(goal_id):
        goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first_or_404()

        if request.method == "POST":
            goal.title = request.form.get("title", "").strip()
            goal.category = request.form.get("category", "General").strip()
            goal.current_level = request.form.get("current_level", "Beginner").strip()
            goal.daily_minutes = int(request.form.get("daily_minutes", 60) or 60)
            goal.start_date = request.form.get("start_date", "").strip()
            goal.deadline = request.form.get("deadline", "").strip()
            goal.reminder_time = request.form.get("reminder_time", "").strip()
            goal.notes = request.form.get("notes", "").strip()
            db.session.commit()
            flash("Goal changes saved.", "success")
            return redirect(url_for("goals"))

        return render_template("edit_goal.html", goal=goal)

    @app.route("/goal/<int:goal_id>/delete")
    @login_required
    def delete_goal(goal_id):
        goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first_or_404()
        for task in list(goal.tasks):
            db.session.delete(task)
        db.session.delete(goal)
        db.session.commit()
        flash("Goal and its tasks were deleted.", "success")
        return redirect(url_for("goals"))

    @app.route("/tasks", methods=["GET", "POST"])
    @login_required
    def tasks():
        if request.method == "POST":
            task = StudyTask(
                user_id=current_user.id,
                title=request.form.get("title", "").strip(),
                category=request.form.get("category", "Study").strip(),
                custom_category=request.form.get("custom_category", "").strip(),
                topic=request.form.get("topic", "").strip(),
                custom_topic=request.form.get("custom_topic", "").strip(),
                skill=request.form.get("skill", "General").strip(),
                custom_skill=request.form.get("custom_skill", "").strip(),
                language=(
                    " > ".join([p for p in [
                        request.form.get("language", "").strip(),
                        request.form.get("practice_type", "").strip(),
                        request.form.get("csca_detailed_topic", "").strip()
                    ] if p])
                    if request.form.get("topic", "").strip() == "CSCA"
                    else (request.form.get("language_custom", "").strip() if request.form.get("language", "").strip() == "Other" else request.form.get("language", "").strip())
                ),
                practice_type=(
                    request.form.get("csca_training_type", "").strip()
                    if request.form.get("topic", "").strip() == "CSCA"
                    else (request.form.get("practice_type_custom", "").strip() if request.form.get("practice_type", "").strip() == "Other" else request.form.get("practice_type", "").strip())
                ),
                source=request.form.get("source", "").strip(),
                difficulty=int(request.form.get("difficulty", 1) or 1),
                priority=int(request.form.get("priority", 3) or 3),
                estimated_minutes=int(request.form.get("estimated_minutes", 30) or 30),
                start_date=request.form.get("start_date", "").strip(),
                due_date=request.form.get("due_date", "").strip(),
                reminder_time=request.form.get("reminder_time", "").strip(),
                repeat_type=request.form.get("repeat_type", "daily").strip(),
                repeat_days=",".join(request.form.getlist("repeat_days")),
                notes=request.form.get("notes", "").strip(),
            )

            if not task.title:
                flash("Task title is required.", "error")
                return redirect(url_for("tasks"))

            db.session.add(task)
            db.session.commit()
            flash("Task saved.", "success")
            return redirect(url_for("tasks"))

        all_tasks = StudyTask.query.filter_by(user_id=current_user.id).order_by(
            StudyTask.status.asc(),
            StudyTask.priority.desc(),
            StudyTask.difficulty.asc(),
            StudyTask.id.desc(),
        ).all()
        return render_template("tasks.html", tasks=all_tasks)

    @app.route("/task/<int:task_id>/edit", methods=["GET", "POST"])
    @login_required
    def edit_task(task_id):
        task = StudyTask.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()

        if request.method == "POST":
            task.title = request.form.get("title", "").strip()
            task.category = request.form.get("category", "Study").strip()
            task.custom_category = request.form.get("custom_category", "").strip()
            task.topic = request.form.get("topic", "").strip()
            task.custom_topic = request.form.get("custom_topic", "").strip()
            task.skill = request.form.get("skill", "General").strip()
            task.custom_skill = request.form.get("custom_skill", "").strip()
            if request.form.get("topic", "").strip() == "CSCA":
                task.language = " > ".join([p for p in [
                    request.form.get("language", "").strip(),
                    request.form.get("practice_type", "").strip(),
                    request.form.get("csca_detailed_topic", "").strip()
                ] if p])
                task.practice_type = request.form.get("csca_training_type", "").strip()
            else:
                task.language = (request.form.get("language_custom", "").strip() if request.form.get("language", "").strip() == "Other" else request.form.get("language", "").strip())
                task.practice_type = (request.form.get("practice_type_custom", "").strip() if request.form.get("practice_type", "").strip() == "Other" else request.form.get("practice_type", "").strip())
            task.source = request.form.get("source", "").strip()
            task.difficulty = int(request.form.get("difficulty", 1) or 1)
            task.priority = int(request.form.get("priority", 3) or 3)
            task.estimated_minutes = int(request.form.get("estimated_minutes", 30) or 30)
            task.start_date = request.form.get("start_date", "").strip()
            task.due_date = request.form.get("due_date", "").strip()
            task.reminder_time = request.form.get("reminder_time", "").strip()
            task.repeat_type = request.form.get("repeat_type", "daily").strip()
            task.repeat_days = ",".join(request.form.getlist("repeat_days"))
            task.notes = request.form.get("notes", "").strip()
            db.session.commit()
            flash("Task changes saved.", "success")
            return redirect(url_for("tasks"))

        return render_template("edit_task.html", task=task)

    @app.route("/task/<int:task_id>/done")
    @login_required
    def mark_task_done(task_id):
        task = StudyTask.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        task.status = "done"
        task.review_count += 1
        task.last_reviewed = str(date.today())
        db.session.commit()

        if os.environ.get("SEND_TASK_COMPLETION_EMAILS", "false").lower() == "true" and task.completion_email_sent_at != str(date.today()):
            if send_task_completion_email(current_user, task):
                task.completion_email_sent_at = str(date.today())
                db.session.commit()

        session["toast_notifications"] = [{
            "title": "Great work!",
            "body": f"You completed: {task.title}. Keep your momentum going."
        }]

        flash("Task marked as done.", "success")
        return redirect(url_for("tasks"))

    @app.route("/task/<int:task_id>/pending")
    @login_required
    def mark_task_pending(task_id):
        task = StudyTask.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        task.status = "pending"
        db.session.commit()
        flash("Task returned to pending.", "success")
        return redirect(url_for("tasks"))

    @app.route("/task/<int:task_id>/delete")
    @login_required
    def delete_task(task_id):
        task = StudyTask.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        db.session.delete(task)
        db.session.commit()
        flash("Task deleted.", "success")
        return redirect(url_for("tasks"))

    @app.route("/languages")
    @login_required
    def languages():
        tasks = StudyTask.query.filter_by(user_id=current_user.id, category="Language").order_by(StudyTask.id.desc()).all()
        return render_template("languages.html", tasks=tasks)

    @app.route("/interview", methods=["GET", "POST"])
    @login_required
    def interview():
        generated = None

        if request.method == "POST":
            scholarship = request.form.get("scholarship", "").strip()
            major = request.form.get("major", "").strip()
            profile = request.form.get("profile", "").strip()

            if not scholarship or not major:
                flash("Scholarship and major are required.", "error")
                return redirect(url_for("interview"))

            prompt = f"""
You are a scholarship interview coach.

Student profile:
{profile}

Scholarship: {scholarship}
Major: {major}

Generate 5 realistic interview questions. For each question, provide:
- question
- why_they_ask
- answer_strategy

Return valid JSON array only.
"""
            ai_text = call_ai(ai_client, prompt, max_tokens=900, temperature=0.5)
            generated = parse_json_array(ai_text)

            if generated:
                for item in generated:
                    q = InterviewAnswer(
                        user_id=current_user.id,
                        scholarship=scholarship,
                        major=major,
                        question=item.get("question", str(item)),
                    )
                    db.session.add(q)
                db.session.commit()

        saved_questions = InterviewAnswer.query.filter_by(user_id=current_user.id).order_by(InterviewAnswer.id.desc()).limit(20).all()
        return render_template("interview.html", generated=generated, saved_questions=saved_questions)

    @app.route("/answer/<int:answer_id>", methods=["GET", "POST"])
    @login_required
    def answer_question(answer_id):
        item = InterviewAnswer.query.filter_by(id=answer_id, user_id=current_user.id).first_or_404()

        if request.method == "POST":
            answer = request.form.get("answer", "").strip()
            action = request.form.get("action", "save")

            if not answer:
                flash("Answer is required.", "error")
                return redirect(url_for("answer_question", answer_id=answer_id))

            item.answer = answer

            if action == "evaluate":
                prompt = f"""
You are a strict but helpful scholarship interview evaluator.

Question:
{item.question}

Student answer:
{answer}

Evaluate the answer. Return valid JSON only:
{{
  "score": integer from 0 to 10,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."],
  "improved_answer": "..."
}}
"""
                status = ai_usage_status(current_user, "scholarship")
                if not status["allowed"]:
                    flash("Your daily AI Coach limit has been reached. You can still save your answer.", "error")
                    db.session.commit()
                    return redirect(url_for("answer_question", answer_id=answer_id))

                ai_text = call_ai(ai_client, prompt, max_tokens=800, temperature=0.3)
                record_ai_usage(current_user, "scholarship")
                result = parse_json_object(ai_text)
                item.score = result.get("score", 0)
                item.feedback = json.dumps(result, ensure_ascii=False, indent=2)

            db.session.commit()
            flash("Answer saved.", "success")
            return redirect(url_for("answer_question", answer_id=answer_id))

        feedback = None
        if item.feedback:
            try:
                feedback = json.loads(item.feedback)
            except Exception:
                feedback = {"raw": item.feedback}

        return render_template("answer.html", item=item, feedback=feedback)

    @app.route("/english", methods=["GET", "POST"])
    @login_required
    def english():
        result = None
        essay_result = None
        active_tab = "quick"

        if request.method == "POST":
            coach_type = request.form.get("coach_type", "quick").strip()
            active_tab = coach_type

            status = ai_usage_status(current_user, "english")
            if not status["allowed"]:
                flash("Your daily English Coach limit has been reached. You can still use goals and tasks.", "error")
                return redirect(url_for("english"))

            if coach_type == "essay":
                topic = request.form.get("essay_topic", "").strip()
                essay = request.form.get("essay_text", "").strip()

                if not topic or not essay:
                    flash("Please write both the essay topic/question and your essay.", "error")
                    return redirect(url_for("english"))

                prompt = f"""
You are EduPath AI Essay Coach for English learners and scholarship/test preparation students.

Essay topic or question:
{topic}

Student essay:
{essay}

Analyze the essay carefully. Return valid JSON only with this exact structure:
{{
  "corrected_text": "A corrected version of the student's essay. Keep the student's meaning, but fix spelling, grammar, word choice, unclear expressions, illogical usage, and sentences that do not fit the topic.",
  "corrections": [
    {{
      "original": "the wrong word, phrase, sentence, or idea",
      "correction": "the corrected version",
      "why": "explain clearly why it is wrong or weak",
      "how_to_improve": "explain how the student can avoid this mistake"
    }}
  ],
  "writing_tips": [
    "practical advice to write better and faster under time pressure"
  ],
  "topic_vocabulary": [
    {{
      "word_or_phrase": "useful word or phrase not used by the student",
      "meaning": "short meaning",
      "example": "short example sentence related to the topic"
    }}
  ]
}}

Rules:
- Be practical, clear, and encouraging.
- If the essay includes ideas unrelated to the topic, mention that clearly in corrections.
- Vocabulary must be related to the topic and should mostly be different from words already used by the student.
- Do not add markdown outside JSON.
"""
                ai_text = call_ai(ai_client, prompt, max_tokens=1400, temperature=0.35)
                record_ai_usage(current_user, "english")
                essay_result = parse_json_object(ai_text)

            else:
                text = request.form.get("text", "").strip()
                mode = request.form.get("mode", "natural").strip()

                if not text:
                    flash("Please write text first.", "error")
                    return redirect(url_for("english"))

                prompt = f"""
You are an English coach for a scholarship student.

Mode: {mode}

Student text:
{text}

Return valid JSON only:
{{
  "corrected_text": "...",
  "natural_version": "...",
  "simple_explanation": ["..."],
  "useful_vocabulary": ["..."]
}}
"""
                ai_text = call_ai(ai_client, prompt, max_tokens=700, temperature=0.4)
                record_ai_usage(current_user, "english")
                result = parse_json_object(ai_text)

        return render_template("english.html", result=result, essay_result=essay_result, active_tab=active_tab)
    @app.route("/programming", methods=["GET", "POST"])
    @login_required
    def programming():
        result = None

        if request.method == "POST":
            problem = request.form.get("problem", "").strip()
            code = request.form.get("code", "").strip()
            error = request.form.get("error", "").strip()

            prompt = f"""
You are a programming tutor. Do not give the final solution directly unless necessary.
Explain the likely error, give hints, debugging steps, and one small corrected example if useful.

Problem:
{problem}

Code:
{code}

Error:
{error}

Return valid JSON:
{{
 "likely_problem": "...",
 "hints": ["..."],
 "debugging_steps": ["..."],
 "what_to_learn": ["..."]
}}
"""
            ai_text = call_ai(ai_client, prompt, max_tokens=800, temperature=0.3)
            result = parse_json_object(ai_text)

        mistakes = MistakeLog.query.filter_by(user_id=current_user.id).order_by(MistakeLog.id.desc()).limit(12).all()
        return render_template("programming.html", result=result, mistakes=mistakes)

    @app.route("/mistake", methods=["POST"])
    @login_required
    def add_mistake():
        area = request.form.get("area", "General").strip()
        mistake = request.form.get("mistake", "").strip()
        correction = request.form.get("correction", "").strip()

        if mistake:
            db.session.add(MistakeLog(user_id=current_user.id, area=area, mistake=mistake, correction=correction))
            db.session.commit()
            flash("Mistake saved to your learning log.", "success")

        return redirect(url_for("programming"))

    @app.route("/api/tasks")
    @login_required
    def api_tasks():
        tasks = StudyTask.query.filter_by(user_id=current_user.id, status="pending").all()
        return jsonify([
            {
                "id": t.id,
                "title": t.title,
                "category": t.category,
                "language": t.language,
                "practice_type": t.practice_type,
                "source": t.source,
                "due_date": t.due_date,
                "reminder_time": t.reminder_time,
                "repeat_type": t.repeat_type,
                "repeat_days": t.repeat_days,
                "minutes": t.estimated_minutes,
            }
            for t in tasks
        ])

    @app.route("/api/smart_plan", methods=["POST"])
    @login_required
    def api_smart_plan():
        data = request.get_json(force=True)
        title = data.get("title", "General goal")
        level = data.get("level", "Beginner")
        daily_minutes = int(data.get("daily_minutes", 60))
        days = int(data.get("days", 14))
        category = data.get("category", "General")
        plan = generate_algorithmic_plan(title, level, daily_minutes, days, category=category)
        return jsonify({"plan": plan})

    return app




def calculate_goal_time_left(deadline):
    if not deadline:
        return None
    try:
        target = datetime.strptime(deadline, "%Y-%m-%d").date()
        days = (target - date.today()).days
        return {"days": days, "weeks": round(days / 7, 1), "months": round(days / 30.44, 1), "status": "remaining" if days >= 0 else "overdue"}
    except Exception:
        return None



def calculate_goal_progress(goal):
    """Smart progress based on completed tasks that are directly attached or semantically related."""
    try:
        all_tasks = StudyTask.query.filter_by(user_id=goal.user_id).all()
        if not all_tasks:
            return 0

        goal_text = " ".join([
            goal.title or "",
            goal.category or "",
            goal.current_level or "",
            goal.notes or "",
        ]).lower()

        strong_terms = [
            "ielts", "toefl", "duolingo", "hsk", "sat",
            "english", "writing", "reading", "listening", "speaking",
            "python", "javascript", "algorithm", "data", "scholarship",
            "interview", "motivation", "cv", "mathematics", "math",
            "ai", "machine learning", "project"
        ]

        related = []
        for task in all_tasks:
            task_text = " ".join([
                task.title or "",
                task.category or "",
                task.custom_category or "",
                task.topic or "",
                task.custom_topic or "",
                task.skill or "",
                task.custom_skill or "",
                task.language or "",
                task.practice_type or "",
                task.notes or "",
            ]).lower()

            if task.goal_id == goal.id:
                related.append(task)
                continue

            score = 0
            for term in strong_terms:
                if term in goal_text and term in task_text:
                    score += 2

            goal_words = [w for w in re.findall(r"[a-zA-Z0-9]+", goal_text) if len(w) >= 4]
            for word in goal_words:
                if word in task_text:
                    score += 1

            if score >= 2:
                related.append(task)

        if not related:
            return 0

        done = sum(1 for task in related if task.status == "done")
        return min(100, int((done / len(related)) * 100))
    except Exception:
        logger.exception("Smart goal progress calculation failed")
        return 0

def ensure_database_columns():
    """Safe lightweight migration for SQLite and PostgreSQL.

    This prevents Internal Server Error after adding new columns while keeping existing data.
    """
    try:
        dialect = db.engine.dialect.name

        if dialect == "postgresql":
            with db.engine.connect() as connection:
                postgres_sql = [
                    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE',
                    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP',
                    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE',
                    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT TRUE',
                    'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS ai_daily_limit INTEGER DEFAULT 1',

                    'ALTER TABLE goal ADD COLUMN IF NOT EXISTS user_id INTEGER',

                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS user_id INTEGER',
                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS repeat_days VARCHAR(120)',
                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS topic VARCHAR(120)',
                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS custom_category VARCHAR(120)',
                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS custom_topic VARCHAR(120)',
                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS custom_skill VARCHAR(120)',
                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS email_reminder_sent_at VARCHAR(40)',
                    'ALTER TABLE study_task ADD COLUMN IF NOT EXISTS completion_email_sent_at VARCHAR(40)',

                    'ALTER TABLE interview_answer ADD COLUMN IF NOT EXISTS user_id INTEGER',
                    'ALTER TABLE mistake_log ADD COLUMN IF NOT EXISTS user_id INTEGER',

                    """CREATE TABLE IF NOT EXISTS ai_usage (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        tool_name VARCHAR(80) NOT NULL DEFAULT 'general',
                        usage_date VARCHAR(20) NOT NULL,
                        count INTEGER NOT NULL DEFAULT 0,
                        created_at TIMESTAMP
                    )""",
                    """CREATE TABLE IF NOT EXISTS admin_message (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        admin_id INTEGER,
                        message_type VARCHAR(60) NOT NULL DEFAULT 'encouragement',
                        title VARCHAR(180) NOT NULL DEFAULT 'Message from EduPath AI',
                        body TEXT NOT NULL,
                        is_read BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMP
                    )""",
                ]

                for sql in postgres_sql:
                    connection.exec_driver_sql(sql)

                connection.commit()
                logger.info("PostgreSQL lightweight migration completed")
            return

        if dialect != "sqlite":
            logger.info("Skipping migration for unsupported database dialect: %s", dialect)
            return

        with db.engine.connect() as connection:
            table_columns = {}
            for table in ["user", "goal", "study_task", "interview_answer", "mistake_log", "ai_usage"]:
                try:
                    table_columns[table] = [row[1] for row in connection.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()]
                except Exception:
                    table_columns[table] = []

            additions = {
                "user": {
                    "email_verified": "ALTER TABLE user ADD COLUMN email_verified BOOLEAN DEFAULT 0",
                    "verification_sent_at": "ALTER TABLE user ADD COLUMN verification_sent_at DATETIME",
                    "is_admin": "ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT 0",
                    "ai_enabled": "ALTER TABLE user ADD COLUMN ai_enabled BOOLEAN DEFAULT 1",
                    "ai_daily_limit": "ALTER TABLE user ADD COLUMN ai_daily_limit INTEGER DEFAULT 1",
                },
                "goal": {
                    "user_id": "ALTER TABLE goal ADD COLUMN user_id INTEGER",
                },
                "study_task": {
                    "user_id": "ALTER TABLE study_task ADD COLUMN user_id INTEGER",
                    "repeat_days": "ALTER TABLE study_task ADD COLUMN repeat_days VARCHAR(120)",
                    "topic": "ALTER TABLE study_task ADD COLUMN topic VARCHAR(120)",
                    "custom_category": "ALTER TABLE study_task ADD COLUMN custom_category VARCHAR(120)",
                    "custom_topic": "ALTER TABLE study_task ADD COLUMN custom_topic VARCHAR(120)",
                    "custom_skill": "ALTER TABLE study_task ADD COLUMN custom_skill VARCHAR(120)",
                    "email_reminder_sent_at": "ALTER TABLE study_task ADD COLUMN email_reminder_sent_at VARCHAR(40)",
                    "completion_email_sent_at": "ALTER TABLE study_task ADD COLUMN completion_email_sent_at VARCHAR(40)",
                },
                "interview_answer": {
                    "user_id": "ALTER TABLE interview_answer ADD COLUMN user_id INTEGER",
                },
                "mistake_log": {
                    "user_id": "ALTER TABLE mistake_log ADD COLUMN user_id INTEGER",
                },
            }

            for table, cols in additions.items():
                existing = table_columns.get(table, [])
                for column, sql in cols.items():
                    if column not in existing:
                        connection.exec_driver_sql(sql)

            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS ai_usage (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    tool_name VARCHAR(80) NOT NULL DEFAULT 'general',
                    usage_date VARCHAR(20) NOT NULL,
                    count INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME
                )
            """)
            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS admin_message (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    admin_id INTEGER,
                    message_type VARCHAR(60) NOT NULL DEFAULT 'encouragement',
                    title VARCHAR(180) NOT NULL DEFAULT 'Message from EduPath AI',
                    body TEXT NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT 0,
                    created_at DATETIME
                )
            """)
            connection.commit()
            logger.info("SQLite lightweight migration completed")
    except Exception:
        logger.exception("Database column migration failed")

def build_ai_client():
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        logger.warning("OPENROUTER_API_KEY is missing. App will use fallback responses.")
        return None

    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=key,
        default_headers={
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "EduPath AI EZZALDEEN",
        },
    )


def call_ai(client, prompt, max_tokens=500, temperature=0.4):
    if client is None:
        return fallback_ai_response(prompt)

    model = os.environ.get("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3-0324:free")

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are EduPath AI EZZALDEEN, a natural, practical, honest learning coach. "
                        "Use simple clear language. Do not invent facts."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.exception("AI call failed")
        return fallback_ai_response(prompt, error=str(e))


def fallback_ai_response(prompt, error=None):
    if "Generate 5 realistic interview questions" in prompt:
        return json.dumps([
            {
                "question": "Tell us about yourself and your academic background.",
                "why_they_ask": "They want to understand your profile and motivation.",
                "answer_strategy": "Mention your academic strength, computer science interest, projects, volunteering, and future goals.",
            },
            {
                "question": "Why did you choose Computer Science?",
                "why_they_ask": "They want to know if your choice is serious and connected to your future.",
                "answer_strategy": "Connect mathematics, problem-solving, programming, AI, and practical impact.",
            },
            {
                "question": "Why do you deserve this scholarship?",
                "why_they_ask": "They want evidence of excellence, discipline, and potential.",
                "answer_strategy": "Mention your GPA, self-learning, projects, volunteering, and clear goals.",
            },
            {
                "question": "What are your future plans after graduation?",
                "why_they_ask": "They want to see if you have a realistic long-term vision.",
                "answer_strategy": "Explain your plan to gain strong CS skills and use technology to help education and healthcare.",
            },
            {
                "question": "What challenge have you overcome?",
                "why_they_ask": "They want to assess resilience.",
                "answer_strategy": "Use a real challenge such as limited resources and explain how you continued learning.",
            },
        ], ensure_ascii=False)

    if "Evaluate the answer" in prompt:
        return json.dumps({
            "score": 7,
            "strengths": [
                "The answer is understandable.",
                "It has a clear personal direction.",
            ],
            "weaknesses": [
                "It needs a more specific example.",
                "The ending can be stronger.",
            ],
            "suggestions": [
                "Add one real achievement or project.",
                "Connect your answer more clearly to the scholarship.",
            ],
            "improved_answer": "This is a good start. Make it more specific by adding one personal example and linking it to your future goals.",
        }, ensure_ascii=False)

    if "English coach" in prompt:
        return json.dumps({
            "corrected_text": "Your text was received. Add your OpenRouter API key to get full AI correction.",
            "natural_version": "Add your OpenRouter API key to generate a natural English version.",
            "simple_explanation": [
                "Fallback mode is working.",
                "AI correction needs OPENROUTER_API_KEY.",
            ],
            "useful_vocabulary": ["clear", "natural", "confident"],
        }, ensure_ascii=False)

    if "programming tutor" in prompt:
        return json.dumps({
            "likely_problem": "AI mode is not enabled yet, but the debugging coach page is working.",
            "hints": ["Add your OpenRouter API key in .env.", "Then paste your code and error message."],
            "debugging_steps": ["Read the error line.", "Print variables.", "Test one small part at a time."],
            "what_to_learn": ["Debugging habits", "Reading error messages"],
        }, ensure_ascii=False)

    return json.dumps({
        "message": "Fallback mode is active. Add OPENROUTER_API_KEY to enable full AI features.",
        "error": error or "",
    }, ensure_ascii=False)


def create_initial_tasks(goal):
    plan = generate_algorithmic_plan(goal.title, goal.current_level, goal.daily_minutes, days=14, category=goal.category)

    for day in plan:
        for item in day["tasks"]:
            task = StudyTask(
                user_id=goal.user_id,
                goal_id=goal.id,
                title=item["title"],
                category=goal.category if goal.category != "English" else "Language",
                skill=item["skill"],
                language="English" if goal.category == "English" else "",
                practice_type=item.get("practice_type", ""),
                source="",
                difficulty=item["difficulty"],
                priority=item["priority"],
                estimated_minutes=item["minutes"],
                start_date=goal.start_date or str(date.today()),
                due_date=day["date"],
                reminder_time=goal.reminder_time,
                repeat_type="daily",
                repeat_days="",
            )
            db.session.add(task)

    db.session.commit()


def generate_algorithmic_plan(title, level, daily_minutes, days=14, category="General"):
    today = date.today()
    skill_templates = infer_skills(title, category)
    level_factor = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}.get(level, 1)

    plan = []

    for i in range(days):
        current_date = today + timedelta(days=i)
        available = daily_minutes
        daily_tasks = []

        main_skill = skill_templates[i % len(skill_templates)]
        difficulty = min(5, level_factor + (i // 4))
        main_minutes = max(25, int(available * 0.5))

        daily_tasks.append({
            "title": f"Study {main_skill}: {title}",
            "skill": main_skill,
            "practice_type": main_skill if main_skill in ["Reading", "Writing", "Listening", "Speaking"] else "",
            "difficulty": difficulty,
            "priority": 5,
            "minutes": main_minutes,
        })

        available -= main_minutes

        practice_minutes = max(20, int(daily_minutes * 0.3))
        daily_tasks.append({
            "title": f"Practice exercises for {main_skill}",
            "skill": main_skill,
            "practice_type": main_skill if main_skill in ["Reading", "Writing", "Listening", "Speaking"] else "",
            "difficulty": difficulty,
            "priority": 4,
            "minutes": min(practice_minutes, available),
        })

        available -= min(practice_minutes, available)

        if i >= 2 and i % 3 == 0:
            review_skill = skill_templates[(i - 2) % len(skill_templates)]
            daily_tasks.append({
                "title": f"Spaced review: {review_skill}",
                "skill": review_skill,
                "practice_type": review_skill if review_skill in ["Reading", "Writing", "Listening", "Speaking"] else "",
                "difficulty": max(1, difficulty - 1),
                "priority": 5,
                "minutes": max(15, min(available, 25)),
            })

        plan.append({"day": i + 1, "date": str(current_date), "tasks": daily_tasks})

    return plan


def infer_skills(title, category="General"):
    """Choose relevant skills based on category first, then title."""
    text = (title or "").lower()
    category_text = (category or "General").lower()

    if category_text in ["english", "language"]:
        return ["Reading", "Writing", "Listening", "Speaking", "Vocabulary", "Grammar"]

    if category_text == "programming":
        return ["Concepts", "Problem Solving", "Coding Practice", "Debugging", "Project Building"]

    if category_text == "mathematics":
        return ["Concept Understanding", "Solved Examples", "Problem Solving", "Review", "Timed Practice"]

    if category_text == "scholarship":
        return ["Research", "Documents", "Motivation", "Interview Practice", "Final Review"]

    if category_text == "ai":
        return ["Python Basics", "Data", "Models", "Evaluation", "Projects"]

    if any(word in text for word in ["english", "toefl", "ielts", "turkish", "russian", "indonesian", "romanian", "language"]):
        return ["Reading", "Writing", "Listening", "Speaking", "Vocabulary", "Grammar"]

    if any(word in text for word in ["python", "programming", "coding", "codeforces", "javascript", "flask", "react"]):
        return ["Concepts", "Problem Solving", "Coding Practice", "Debugging", "Project Building"]

    if any(word in text for word in ["math", "mathematics", "calculus", "algebra", "geometry"]):
        return ["Concept Understanding", "Solved Examples", "Problem Solving", "Review", "Timed Practice"]

    if any(word in text for word in ["scholarship", "interview", "motivation letter", "application"]):
        return ["Research", "Documents", "Motivation", "Interview Practice", "Final Review"]

    if any(word in text for word in ["ai", "machine learning", "data"]):
        return ["Python Basics", "Data", "Models", "Evaluation", "Projects"]

    return ["Planning", "Learning", "Practice", "Review", "Application"]

def detect_weaknesses():
    pending = StudyTask.query.filter_by(status="pending").all()
    counts = {}

    for task in pending:
        key = task.skill or task.category or "General"
        counts[key] = counts.get(key, 0) + (task.priority or 1)

    sorted_items = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return sorted_items[:5]


def parse_json_array(text):
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data
    except Exception:
        pass

    start = text.find("[")
    end = text.rfind("]")

    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(text[start:end + 1])
            if isinstance(data, list):
                return data
        except Exception:
            pass

    return []


def parse_json_object(text):
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(text[start:end + 1])
            if isinstance(data, dict):
                return data
        except Exception:
            pass

    return {"raw": text}

# Render/Gunicorn compatibility:
# Supports both `gunicorn run:app` and `gunicorn app:app`.
app = create_app()
