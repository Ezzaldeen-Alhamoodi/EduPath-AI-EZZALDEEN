\
import os
import json
import logging
import unicodedata
import secrets
import string
import re
from datetime import datetime, date, timedelta

from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from openai import OpenAI
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from flask_mail import Mail, Message
from markupsafe import Markup, escape

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
    task_limit = db.Column(db.Integer, nullable=False, default=20)
    goal_limit = db.Column(db.Integer, nullable=False, default=5)
    paid_ai_daily_limit = db.Column(db.Integer, nullable=False, default=50)
    paid_task_limit = db.Column(db.Integer, nullable=False, default=500)
    paid_goal_limit = db.Column(db.Integer, nullable=False, default=100)
    subscription_code = db.Column(db.String(32), nullable=True, unique=True, index=True)
    paid_active = db.Column(db.Boolean, nullable=False, default=False)
    paid_activated_at = db.Column(db.DateTime, nullable=True)
    subscription_expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    goals = db.relationship("Goal", backref="owner", lazy=True)
    tasks = db.relationship("StudyTask", backref="owner", lazy=True)
    interview_answers = db.relationship("InterviewAnswer", backref="owner", lazy=True)
    mistakes = db.relationship("MistakeLog", backref="owner", lazy=True)


class SubscriptionCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(48), nullable=False, unique=True, index=True)
    duration_days = db.Column(db.Integer, nullable=False, default=30)
    is_used = db.Column(db.Boolean, nullable=False, default=False)
    used_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    used_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    is_cancelled = db.Column(db.Boolean, nullable=False, default=False)
    created_by_admin_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    note = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    used_by_user = db.relationship("User", foreign_keys=[used_by_user_id], backref="activated_subscription_codes")
    created_by_admin = db.relationship("User", foreign_keys=[created_by_admin_id], backref="created_subscription_codes")


class SubscriptionActivationAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    attempted_code = db.Column(db.String(80), nullable=True)
    was_successful = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User", backref="subscription_activation_attempts")


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




class LearningResource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(180), nullable=False, index=True)
    category = db.Column(db.String(80), nullable=False, index=True)
    subcategory = db.Column(db.String(120), nullable=True, index=True)
    skill = db.Column(db.String(120), nullable=True, index=True)
    exam = db.Column(db.String(80), nullable=True, index=True)
    level = db.Column(db.String(80), nullable=True)
    resource_type = db.Column(db.String(80), nullable=True, index=True)
    url = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=True)
    tags_json = db.Column(db.Text, nullable=True)
    is_official = db.Column(db.Boolean, nullable=False, default=False)
    is_free = db.Column(db.Boolean, nullable=False, default=True)
    language = db.Column(db.String(40), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    @property
    def tags(self):
        try:
            return json.loads(self.tags_json or "[]")
        except Exception:
            return []


class SavedResource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    resource_id = db.Column(db.Integer, db.ForeignKey("learning_resource.id"), nullable=False, index=True)
    status = db.Column(db.String(40), nullable=False, default="Not Started")
    notes = db.Column(db.Text, nullable=True)
    last_opened = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User", backref="saved_resources")
    resource = db.relationship("LearningResource", backref="saved_by_users")



class EnglishCoachSavedAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    coach_type = db.Column(db.String(30), nullable=False, default="quick")
    mode = db.Column(db.String(80), nullable=True)
    topic = db.Column(db.Text, nullable=True)
    original_text = db.Column(db.Text, nullable=True)
    result_json = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User", backref="saved_english_answers")


class GoalTaskLink(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    goal_id = db.Column(db.Integer, db.ForeignKey("goal.id"), nullable=False, index=True)
    task_id = db.Column(db.Integer, db.ForeignKey("study_task.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    match_score = db.Column(db.Integer, nullable=False, default=0)
    match_reason = db.Column(db.Text, nullable=True)
    progress_added = db.Column(db.Float, nullable=False, default=0.0)
    is_confirmed_by_user = db.Column(db.Boolean, nullable=False, default=False)
    linked_at = db.Column(db.DateTime, default=datetime.utcnow)

    goal = db.relationship("Goal", backref="smart_links")
    task = db.relationship("StudyTask", backref="smart_goal_links")


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


def generate_subscription_code():
    alphabet = string.ascii_uppercase + string.digits
    # Long, random, human-readable code. Generated using secrets, not random.
    return "EPAI-" + "-".join(
        "".join(secrets.choice(alphabet) for _ in range(5))
        for _ in range(4)
    )


def generate_unique_subscription_code():
    code = generate_subscription_code()
    while SubscriptionCode.query.filter_by(code=code).first():
        code = generate_subscription_code()
    return code


def ensure_user_subscription_code(user):
    """Legacy compatibility only. New system uses global SubscriptionCode pool."""
    if not getattr(user, "subscription_code", None):
        user.subscription_code = generate_unique_subscription_code()
    return user.subscription_code


def ensure_user_subscription_codes(user, minimum=0):
    """Legacy compatibility no-op. Codes are no longer pre-assigned to users."""
    ensure_user_subscription_code(user)


def deactivate_expired_subscription(user):
    if getattr(user, "paid_active", False) and user.subscription_expires_at and datetime.utcnow() > user.subscription_expires_at:
        user.paid_active = False
        return True
    return False


def paid_days_left(user):
    if not getattr(user, "paid_active", False) or not user.subscription_expires_at:
        return 0
    delta = user.subscription_expires_at - datetime.utcnow()
    return max(0, delta.days + (1 if delta.seconds > 0 else 0))


def too_many_subscription_attempts(user, max_attempts=5, within_minutes=60):
    since = datetime.utcnow() - timedelta(minutes=within_minutes)
    failed_count = SubscriptionActivationAttempt.query.filter(
        SubscriptionActivationAttempt.user_id == user.id,
        SubscriptionActivationAttempt.was_successful.is_(False),
        SubscriptionActivationAttempt.created_at >= since,
    ).count()
    return failed_count >= max_attempts


def record_subscription_attempt(user, code, success):
    db.session.add(SubscriptionActivationAttempt(
        user_id=user.id,
        attempted_code=(code or "")[:80],
        was_successful=bool(success),
    ))


def activate_subscription_code_for_user(user, raw_code):
    code_value = (raw_code or "").strip().upper()
    if too_many_subscription_attempts(user):
        return False, "Too many failed activation attempts. Please try again later."

    if getattr(user, "paid_active", False) and user.subscription_expires_at and datetime.utcnow() < user.subscription_expires_at:
        return False, "You already have an active paid subscription."

    subscription_code = SubscriptionCode.query.filter_by(code=code_value).first()
    if not subscription_code:
        record_subscription_attempt(user, code_value, False)
        db.session.commit()
        return False, "Invalid subscription code."

    if subscription_code.is_cancelled:
        record_subscription_attempt(user, code_value, False)
        db.session.commit()
        return False, "This subscription code has been cancelled."

    if subscription_code.is_used:
        record_subscription_attempt(user, code_value, False)
        db.session.commit()
        return False, "This subscription code has already been used."

    now = datetime.utcnow()
    subscription_code.is_used = True
    subscription_code.used_by_user_id = user.id
    subscription_code.used_at = now
    subscription_code.expires_at = now + timedelta(days=subscription_code.duration_days)

    user.paid_active = True
    user.paid_activated_at = now
    user.subscription_expires_at = subscription_code.expires_at

    record_subscription_attempt(user, code_value, True)
    db.session.commit()
    return True, f"Paid version activated successfully for {subscription_code.duration_days} days."


def user_has_unlimited_access(user):
    return user_is_admin(user)


def user_task_limit(user):
    deactivate_expired_subscription(user)
    if user_has_unlimited_access(user):
        return None
    return (user.paid_task_limit if getattr(user, "paid_active", False) else user.task_limit) or 0


def user_goal_limit(user):
    deactivate_expired_subscription(user)
    if user_has_unlimited_access(user):
        return None
    return (user.paid_goal_limit if getattr(user, "paid_active", False) else user.goal_limit) or 0


def user_ai_limit(user):
    deactivate_expired_subscription(user)
    if user_has_unlimited_access(user):
        return None
    return (user.paid_ai_daily_limit if getattr(user, "paid_active", False) else user.ai_daily_limit) or 0


def limit_upgrade_message(section_name):
    return (
        f"You have reached the allowed {section_name} limit for your current plan. "
        "To use more, please contact EduPath AI administration to subscribe to the paid version."
    )


def ai_usage_status(user, tool_name="general"):
    if user_has_unlimited_access(user):
        return {"allowed": True, "used": 0, "limit": "unlimited"}

    if not getattr(user, "ai_enabled", True):
        return {"allowed": False, "used": 0, "limit": 0}

    today_value = str(date.today())
    record = AIUsage.query.filter_by(user_id=user.id, tool_name=tool_name, usage_date=today_value).first()
    used = record.count if record else 0
    limit = user_ai_limit(user)
    return {"allowed": used < limit, "used": used, "limit": limit}

def record_ai_usage(user, tool_name="general"):
    if user_has_unlimited_access(user):
        return

    today_value = str(date.today())
    record = AIUsage.query.filter_by(user_id=user.id, tool_name=tool_name, usage_date=today_value).first()
    if not record:
        record = AIUsage(user_id=user.id, tool_name=tool_name, usage_date=today_value, count=0)
        db.session.add(record)
    record.count += 1
    db.session.commit()




RESOURCE_CATEGORY_OPTIONS = [
    "English Skills",
    "English Exams",
    "Chinese & HSK",
    "CSCA",
    "SAT",
    "ACT",
    "GRE",
    "GMAT",
    "Mathematics",
    "Programming & Technology",
    "AI & Data Science",
    "Scholarships",
    "Islamic Learning",
    "General Learning",
]

RESOURCE_EXAM_OPTIONS = [
    "IELTS",
    "TOEFL",
    "Duolingo English Test",
    "HSK",
    "CSCA",
    "SAT",
    "ACT",
    "GRE",
    "GMAT",
]

RESOURCE_TYPE_OPTIONS = [
    "Official",
    "Practice",
    "Course",
    "Website",
    "App",
    "Book",
    "Documentation",
    "Tool",
    "Search Tool",
    "Official Portal",
    "Official Search",
    "Guide",
    "Simulation",
    "Audio",
    "Library",
    "Video Lessons",
    "Notes",
    "Dictionary",
]


def default_learning_resources():
    return [
        {"name":"Khan Academy Arithmetic","category":"Mathematics","subcategory":"Arithmetic","skill":"Arithmetic, Numbers, Fractions","exam":"","level":"Beginner","resource_type":"Course","url":"https://www.khanacademy.org/math/arithmetic","description":"Foundational arithmetic lessons and practice.","tags":["math", "arithmetic", "beginner", "recommended"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Pre-Algebra","category":"Mathematics","subcategory":"Pre-Algebra","skill":"Pre-Algebra, Equations","exam":"","level":"Beginner","resource_type":"Course","url":"https://www.khanacademy.org/math/pre-algebra","description":"Pre-algebra foundations for school, SAT, and CSCA preparation.","tags":["math", "pre algebra", "beginner", "recommended"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Algebra 1","category":"Mathematics","subcategory":"Algebra","skill":"Algebra, Equations, Functions","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://www.khanacademy.org/math/algebra","description":"Strong free algebra course with practice exercises.","tags":["math", "algebra", "functions", "recommended"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Algebra 2","category":"Mathematics","subcategory":"Algebra","skill":"Advanced Algebra, Functions","exam":"","level":"Intermediate","resource_type":"Course","url":"https://www.khanacademy.org/math/algebra2","description":"Advanced algebra and functions practice.","tags":["math", "algebra", "functions"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Geometry","category":"Mathematics","subcategory":"Geometry","skill":"Geometry, Proofs, Shapes","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://www.khanacademy.org/math/geometry","description":"Geometry lessons and exercises.","tags":["math", "geometry", "proofs"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Trigonometry","category":"Mathematics","subcategory":"Trigonometry","skill":"Trigonometry, Unit Circle","exam":"","level":"Intermediate","resource_type":"Course","url":"https://www.khanacademy.org/math/trigonometry","description":"Trigonometry lessons useful for CSCA and SAT math.","tags":["math", "trigonometry", "csca", "sat"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Precalculus","category":"Mathematics","subcategory":"Precalculus","skill":"Functions, Trigonometry, Sequences","exam":"","level":"Intermediate → Advanced","resource_type":"Course","url":"https://www.khanacademy.org/math/precalculus","description":"Precalculus course covering functions and advanced topics.","tags":["math", "precalculus", "functions"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Calculus","category":"Mathematics","subcategory":"Calculus","skill":"Limits, Derivatives, Integrals","exam":"","level":"Intermediate → Advanced","resource_type":"Course","url":"https://www.khanacademy.org/math/calculus-1","description":"Calculus lessons and practice.","tags":["math", "calculus", "derivatives", "integrals"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Statistics","category":"Mathematics","subcategory":"Statistics","skill":"Statistics, Probability","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://www.khanacademy.org/math/statistics-probability","description":"Statistics and probability course.","tags":["math", "statistics", "probability"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Math Is Fun","category":"Mathematics","subcategory":"Foundations","skill":"Arithmetic, Algebra, Geometry, Statistics","exam":"","level":"Beginner → Intermediate","resource_type":"Website","url":"https://www.mathsisfun.com/","description":"Friendly explanations for many math topics.","tags":["math", "beginner", "algebra", "geometry"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Purplemath","category":"Mathematics","subcategory":"Algebra","skill":"Algebra","exam":"","level":"Beginner → Intermediate","resource_type":"Website","url":"https://www.purplemath.com/","description":"Clear algebra explanations and examples.","tags":["math", "algebra", "beginner"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Math Planet","category":"Mathematics","subcategory":"Algebra & Geometry","skill":"Algebra, Geometry, SAT Math","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://www.mathplanet.com/","description":"Math lessons for algebra, geometry, and SAT math.","tags":["math", "sat", "algebra", "geometry"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"CK-12 Math","category":"Mathematics","subcategory":"School Math","skill":"Algebra, Geometry, Calculus, Statistics","exam":"","level":"Beginner → Advanced","resource_type":"Course","url":"https://www.ck12.org/student/","description":"Free interactive math textbooks and practice.","tags":["math", "school", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"OpenStax Prealgebra","category":"Mathematics","subcategory":"Pre-Algebra","skill":"Pre-Algebra","exam":"","level":"Beginner","resource_type":"Book","url":"https://openstax.org/details/books/prealgebra-2e","description":"Free prealgebra textbook.","tags":["math", "prealgebra", "book"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"OpenStax Algebra and Trigonometry","category":"Mathematics","subcategory":"Algebra & Trigonometry","skill":"Algebra, Trigonometry","exam":"","level":"Intermediate","resource_type":"Book","url":"https://openstax.org/details/books/algebra-and-trigonometry-2e","description":"Free algebra and trigonometry textbook.","tags":["math", "algebra", "trigonometry", "book"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"OpenStax Calculus Volume 1","category":"Mathematics","subcategory":"Calculus","skill":"Limits, Derivatives, Integrals","exam":"","level":"Intermediate → Advanced","resource_type":"Book","url":"https://openstax.org/details/books/calculus-volume-1","description":"Free calculus textbook volume 1.","tags":["math", "calculus", "book"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"OpenStax Calculus Volume 2","category":"Mathematics","subcategory":"Calculus","skill":"Integration, Series","exam":"","level":"Advanced","resource_type":"Book","url":"https://openstax.org/details/books/calculus-volume-2","description":"Free calculus textbook volume 2.","tags":["math", "calculus", "series", "book"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"OpenIntro Statistics","category":"Mathematics","subcategory":"Statistics","skill":"Statistics, Probability","exam":"","level":"Intermediate","resource_type":"Book","url":"https://www.openintro.org/book/os/","description":"Free statistics textbook and resources.","tags":["statistics", "probability", "math"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"StatQuest","category":"Mathematics","subcategory":"Statistics","skill":"Statistics, Machine Learning Math","exam":"","level":"Beginner → Advanced","resource_type":"Video Lessons","url":"https://www.youtube.com/@statquest","description":"Clear statistics and ML math explanations.","tags":["statistics", "statquest", "machine learning"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"3Blue1Brown Essence of Linear Algebra","category":"Mathematics","subcategory":"Linear Algebra","skill":"Vectors, Matrices, Linear Algebra","exam":"","level":"Intermediate","resource_type":"Video Lessons","url":"https://www.3blue1brown.com/topics/linear-algebra","description":"Visual linear algebra series.","tags":["linear algebra", "vectors", "matrices"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"MIT OCW Single Variable Calculus","category":"Mathematics","subcategory":"Calculus","skill":"Calculus","exam":"","level":"Advanced","resource_type":"Course","url":"https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/","description":"MIT OpenCourseWare calculus course.","tags":["mit", "calculus", "advanced"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"MIT OCW Linear Algebra","category":"Mathematics","subcategory":"Linear Algebra","skill":"Linear Algebra, Matrices","exam":"","level":"Advanced","resource_type":"Course","url":"https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/","description":"MIT Linear Algebra course by Gilbert Strang.","tags":["mit", "linear algebra", "advanced"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"GeoGebra","category":"Mathematics","subcategory":"Geometry","skill":"Geometry, Graphing, Visualization","exam":"","level":"Beginner → Advanced","resource_type":"Tool","url":"https://www.geogebra.org/","description":"Interactive math visualization and geometry tools.","tags":["geometry", "graphing", "visualization"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Desmos Graphing Calculator","category":"Mathematics","subcategory":"Functions","skill":"Graphing, Functions","exam":"","level":"Beginner → Advanced","resource_type":"Tool","url":"https://www.desmos.com/calculator","description":"Online graphing calculator for functions and visualization.","tags":["functions", "graphing", "desmos"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Symbolab","category":"Mathematics","subcategory":"Problem Solving","skill":"Algebra, Calculus, Step-by-step","exam":"","level":"Beginner → Advanced","resource_type":"Tool","url":"https://www.symbolab.com/","description":"Step-by-step math solver for checking work.","tags":["math", "solver", "algebra", "calculus"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Wolfram Alpha","category":"Mathematics","subcategory":"Problem Solving","skill":"Math Computation","exam":"","level":"Intermediate → Advanced","resource_type":"Tool","url":"https://www.wolframalpha.com/","description":"Computational knowledge engine for math checking and exploration.","tags":["math", "computation", "tool"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Project Euler","category":"Mathematics","subcategory":"Problem Solving","skill":"Math, Programming, Logic","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://projecteuler.net/","description":"Challenging mathematical programming problems.","tags":["math", "programming", "problem solving"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Cut The Knot","category":"Mathematics","subcategory":"Olympiad Mathematics","skill":"Proofs, Geometry, Problem Solving","exam":"","level":"Advanced","resource_type":"Website","url":"https://www.cut-the-knot.org/","description":"Mathematical proofs, puzzles, and problem-solving resources.","tags":["math", "olympiad", "proofs"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Math StackExchange","category":"Mathematics","subcategory":"Problem Solving","skill":"All Math Topics","exam":"","level":"Intermediate → Advanced","resource_type":"Community","url":"https://math.stackexchange.com/","description":"Community questions and answers for math topics.","tags":["math", "community", "problem solving"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"TypingClub","category":"Keyboard Typing","subcategory":"Touch Typing","skill":"10-Finger Typing, Accuracy","exam":"","level":"Beginner → Intermediate","resource_type":"Practice","url":"https://www.typingclub.com/","description":"Structured touch typing lessons for beginners.","tags":["typing", "keyboard", "touch typing", "beginner", "recommended"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Typing.com","category":"Keyboard Typing","subcategory":"Touch Typing","skill":"Typing Speed, Accuracy","exam":"","level":"Beginner → Intermediate","resource_type":"Practice","url":"https://www.typing.com/","description":"Free typing lessons, tests, and practice.","tags":["typing", "speed", "accuracy", "beginner"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Ratatype","category":"Keyboard Typing","subcategory":"Touch Typing","skill":"Typing Speed, Accuracy","exam":"","level":"Beginner → Intermediate","resource_type":"Practice","url":"https://www.ratatype.com/","description":"Typing tutor and speed tests.","tags":["typing", "speed", "accuracy"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Keybr","category":"Keyboard Typing","subcategory":"Typing Accuracy","skill":"Touch Typing, Accuracy","exam":"","level":"Intermediate","resource_type":"Practice","url":"https://www.keybr.com/","description":"Adaptive typing practice focused on weak letters.","tags":["typing", "keybr", "accuracy", "adaptive"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Monkeytype","category":"Keyboard Typing","subcategory":"Typing Speed","skill":"Typing Speed, Accuracy","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://monkeytype.com/","description":"Minimal modern typing test with many modes.","tags":["typing", "monkeytype", "speed", "advanced", "recommended"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"TypeRacer","category":"Keyboard Typing","subcategory":"Typing Speed","skill":"Typing Speed, Competition","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://play.typeracer.com/","description":"Typing races to improve speed and consistency.","tags":["typing", "speed", "competition"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Nitro Type","category":"Keyboard Typing","subcategory":"Typing Speed","skill":"Typing Speed, Competition","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://www.nitrotype.com/","description":"Typing racing game for speed practice.","tags":["typing", "speed", "game"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Typing.io","category":"Keyboard Typing","subcategory":"Programming Typing","skill":"Code Typing, Programming","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://typing.io/","description":"Typing practice using real code snippets for programmers.","tags":["typing", "programming", "code"],"is_official":False,"is_free":False,"language":"English"},
        {"name":"SpeedCoder","category":"Keyboard Typing","subcategory":"Programming Typing","skill":"Code Typing, Programming","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://www.speedcoder.net/","description":"Typing practice for code in multiple programming languages.","tags":["typing", "programming", "code", "speed"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"KeyHero","category":"Keyboard Typing","subcategory":"Typing Test","skill":"Typing Speed, Accuracy","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://www.keyhero.com/","description":"Typing tests and progress tracking.","tags":["typing", "test", "speed"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"10FastFingers","category":"Keyboard Typing","subcategory":"Typing Test","skill":"Typing Speed","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://10fastfingers.com/","description":"Quick typing speed tests in many languages.","tags":["typing", "speed", "test"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"The Physics Classroom","category":"CSCA","subcategory":"Physics","skill":"Mechanics, Waves, Electricity","exam":"CSCA","level":"Beginner → Intermediate","resource_type":"Course","url":"https://www.physicsclassroom.com/","description":"Clear physics tutorials and practice.","tags":["csca", "physics", "mechanics", "electricity"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Flipping Physics","category":"CSCA","subcategory":"Physics","skill":"Mechanics, AP Physics Concepts","exam":"CSCA","level":"Intermediate","resource_type":"Video Lessons","url":"https://www.flippingphysics.com/","description":"Physics videos and practice explanations.","tags":["physics", "mechanics", "csca"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Chemguide","category":"CSCA","subcategory":"Chemistry","skill":"Chemical Concepts, Equilibrium, Reactions","exam":"CSCA","level":"Intermediate → Advanced","resource_type":"Website","url":"https://www.chemguide.co.uk/","description":"Detailed chemistry explanations for high school and early university.","tags":["chemistry", "csca", "equilibrium"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Tyler DeWitt Chemistry","category":"CSCA","subcategory":"Chemistry","skill":"Basic Chemistry, Mole, Reactions","exam":"CSCA","level":"Beginner → Intermediate","resource_type":"Video Lessons","url":"https://www.youtube.com/@tdewitt451","description":"Clear chemistry videos for beginners.","tags":["chemistry", "beginner", "mole", "reactions"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Crash Course Chemistry","category":"CSCA","subcategory":"Chemistry","skill":"Chemistry Concepts","exam":"CSCA","level":"Beginner → Intermediate","resource_type":"Video Lessons","url":"https://www.youtube.com/playlist?list=PL8dPuuaLjXtPHzzYuWy6fYEaX9mQQ8oGr","description":"Fast-paced chemistry overview videos.","tags":["chemistry", "crash course", "csca"],"is_official":False,"is_free":True,"language":"English"},

        {"name":"Breaking News English","category":"English Skills","subcategory":"Reading","skill":"Reading, Vocabulary, Listening","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://breakingnewsenglish.com/","description":"Daily news lessons with multiple levels, reading, listening, vocabulary, and exercises.","tags":["english", "reading", "news", "listening", "vocabulary", "daily"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"News in Levels","category":"English Skills","subcategory":"Reading","skill":"Reading, Listening, Vocabulary","exam":"","level":"Beginner → Intermediate","resource_type":"Website","url":"https://www.newsinlevels.com/","description":"News stories written in three levels for English learners.","tags":["english", "reading", "news", "listening"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"CommonLit","category":"English Skills","subcategory":"Reading","skill":"Reading Comprehension","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://www.commonlit.org/","description":"Free reading passages and comprehension questions, useful for academic reading practice.","tags":["english", "reading", "comprehension", "academic"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"ReadWorks","category":"English Skills","subcategory":"Reading","skill":"Reading Comprehension","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://www.readworks.org/","description":"Reading passages and comprehension sets for different levels.","tags":["english", "reading", "comprehension"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Project Gutenberg","category":"English Skills","subcategory":"Reading","skill":"Extensive Reading","exam":"","level":"Intermediate → Advanced","resource_type":"Library","url":"https://www.gutenberg.org/","description":"Free books for extensive reading and vocabulary growth.","tags":["english", "reading", "books", "literature"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Simple English Wikipedia","category":"English Skills","subcategory":"Reading","skill":"Reading, Vocabulary","exam":"","level":"Beginner → Intermediate","resource_type":"Website","url":"https://simple.wikipedia.org/","description":"Simplified encyclopedia articles useful for reading practice.","tags":["english", "reading", "simple", "vocabulary"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Smithsonian Magazine","category":"English Skills","subcategory":"Reading","skill":"Reading, Academic Vocabulary","exam":"","level":"Advanced","resource_type":"Website","url":"https://www.smithsonianmag.com/","description":"High-quality articles useful for advanced reading and vocabulary.","tags":["english", "reading", "advanced", "articles"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"National Geographic Education","category":"English Skills","subcategory":"Reading","skill":"Reading, Academic Topics","exam":"","level":"Intermediate → Advanced","resource_type":"Website","url":"https://education.nationalgeographic.org/","description":"Educational articles and resources for science, geography, and academic reading.","tags":["english", "reading", "academic", "science"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"TED-Ed","category":"English Skills","subcategory":"Listening","skill":"Listening, Ideas, Vocabulary","exam":"","level":"Intermediate → Advanced","resource_type":"Video Lessons","url":"https://ed.ted.com/","description":"Short educational videos with ideas and vocabulary practice.","tags":["english", "listening", "video", "education"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"TED Talks","category":"English Skills","subcategory":"Listening","skill":"Listening, Speaking Ideas","exam":"","level":"Intermediate → Advanced","resource_type":"Video Lessons","url":"https://www.ted.com/talks","description":"Talks useful for listening practice, ideas, and presentation language.","tags":["english", "listening", "speaking", "ideas"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"British Council LearnEnglish Listening","category":"English Skills","subcategory":"Listening","skill":"Listening","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://learnenglish.britishcouncil.org/skills/listening","description":"British Council listening practice by level.","tags":["english", "listening", "british council"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"British Council LearnEnglish Speaking","category":"English Skills","subcategory":"Speaking","skill":"Speaking","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://learnenglish.britishcouncil.org/skills/speaking","description":"Speaking practice activities and useful spoken English.","tags":["english", "speaking", "british council"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Speak & Improve","category":"English Skills","subcategory":"Speaking","skill":"Speaking, Pronunciation","exam":"","level":"Beginner → Advanced","resource_type":"Tool","url":"https://speakandimprove.com/","description":"Cambridge tool to practice speaking and receive feedback.","tags":["english", "speaking", "pronunciation", "cambridge"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Rachel's English","category":"English Skills","subcategory":"Pronunciation","skill":"Pronunciation, Accent","exam":"","level":"Intermediate → Advanced","resource_type":"Video Lessons","url":"https://rachelsenglish.com/","description":"Pronunciation and American English speaking lessons.","tags":["english", "pronunciation", "speaking"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Forvo","category":"English Skills","subcategory":"Pronunciation","skill":"Pronunciation","exam":"","level":"All Levels","resource_type":"Tool","url":"https://forvo.com/","description":"Hear words pronounced by native speakers in many languages.","tags":["pronunciation", "english", "words"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"ELSA Speak","category":"English Skills","subcategory":"Pronunciation","skill":"Pronunciation, Speaking","exam":"","level":"Beginner → Advanced","resource_type":"App","url":"https://elsaspeak.com/","description":"AI pronunciation app useful for speaking practice.","tags":["english", "pronunciation", "speaking", "app"],"is_official":False,"is_free":False,"language":"English"},
        {"name":"BBC 6 Minute English","category":"English Skills","subcategory":"Listening","skill":"Listening, Vocabulary","exam":"","level":"Intermediate","resource_type":"Audio","url":"https://www.bbc.co.uk/learningenglish/english/features/6-minute-english","description":"Short weekly listening episodes with vocabulary.","tags":["bbc", "english", "listening", "vocabulary"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"British Council Writing","category":"English Skills","subcategory":"Writing","skill":"Writing","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://learnenglish.britishcouncil.org/skills/writing","description":"Writing practice by level with examples and tasks.","tags":["english", "writing", "british council"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Purdue OWL","category":"English Skills","subcategory":"Writing","skill":"Academic Writing, Grammar","exam":"","level":"Intermediate → Advanced","resource_type":"Guide","url":"https://owl.purdue.edu/","description":"Excellent academic writing and grammar reference.","tags":["english", "writing", "academic", "grammar"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Grammarly Blog","category":"English Skills","subcategory":"Writing","skill":"Writing, Grammar","exam":"","level":"Beginner → Advanced","resource_type":"Guide","url":"https://www.grammarly.com/blog/","description":"Writing and grammar explanations with examples.","tags":["english", "writing", "grammar"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Oxford Learner's Dictionaries","category":"English Skills","subcategory":"Vocabulary","skill":"Vocabulary, Pronunciation","exam":"","level":"All Levels","resource_type":"Dictionary","url":"https://www.oxfordlearnersdictionaries.com/","description":"Learner-focused dictionary with examples and pronunciation.","tags":["english", "dictionary", "vocabulary", "pronunciation"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Longman Dictionary","category":"English Skills","subcategory":"Vocabulary","skill":"Vocabulary, Examples","exam":"","level":"All Levels","resource_type":"Dictionary","url":"https://www.ldoceonline.com/","description":"Learner dictionary with simple definitions and examples.","tags":["english", "dictionary", "vocabulary"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Vocabulary.com","category":"English Skills","subcategory":"Vocabulary","skill":"Vocabulary","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://www.vocabulary.com/","description":"Vocabulary learning and quizzes.","tags":["english", "vocabulary", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Quizlet","category":"English Skills","subcategory":"Vocabulary","skill":"Vocabulary, Flashcards","exam":"","level":"All Levels","resource_type":"Tool","url":"https://quizlet.com/","description":"Flashcard tool for vocabulary and exam terms.","tags":["vocabulary", "flashcards", "english"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"IDP IELTS Preparation","category":"English Exams","subcategory":"IELTS Official","skill":"All Skills","exam":"IELTS","level":"All Levels","resource_type":"Official","url":"https://ielts.idp.com/prepare","description":"Official IDP IELTS preparation resources.","tags":["ielts", "idp", "official", "practice"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"IELTS Advantage","category":"English Exams","subcategory":"IELTS Strategy","skill":"Writing, Speaking, Reading, Listening","exam":"IELTS","level":"Intermediate → Advanced","resource_type":"Website","url":"https://www.ieltsadvantage.com/","description":"IELTS strategies, writing help, and band score improvement guidance.","tags":["ielts", "writing", "speaking", "strategy"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"IELTS Simon","category":"English Exams","subcategory":"IELTS Writing","skill":"Writing Task 1, Writing Task 2","exam":"IELTS","level":"Intermediate → Advanced","resource_type":"Website","url":"https://www.ielts-simon.com/","description":"IELTS writing and exam advice from an experienced teacher.","tags":["ielts", "writing", "task 1", "task 2"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"IELTS Buddy","category":"English Exams","subcategory":"IELTS Practice","skill":"All Skills","exam":"IELTS","level":"Intermediate → Advanced","resource_type":"Website","url":"https://www.ieltsbuddy.com/","description":"IELTS lessons, practice, model answers, and tips.","tags":["ielts", "practice", "writing", "speaking"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"IELTS Jacky","category":"English Exams","subcategory":"IELTS Practice","skill":"All Skills","exam":"IELTS","level":"Beginner → Intermediate","resource_type":"Website","url":"https://www.ieltsjacky.com/","description":"Simple IELTS explanations, vocabulary, and practice guidance.","tags":["ielts", "beginner", "vocabulary"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"E2 IELTS","category":"English Exams","subcategory":"IELTS Practice","skill":"All Skills","exam":"IELTS","level":"Intermediate → Advanced","resource_type":"Video Lessons","url":"https://www.e2language.com/","description":"IELTS video lessons and test strategies.","tags":["ielts", "e2", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"IELTS Online Tests","category":"English Exams","subcategory":"IELTS Mock Tests","skill":"Reading, Listening","exam":"IELTS","level":"Intermediate → Advanced","resource_type":"Mock Test","url":"https://ieltsonlinetests.com/","description":"IELTS practice tests, especially reading and listening.","tags":["ielts", "mock test", "reading", "listening"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Road to IELTS","category":"English Exams","subcategory":"IELTS Practice","skill":"All Skills","exam":"IELTS","level":"All Levels","resource_type":"Practice","url":"https://roadtoielts.com/","description":"IELTS preparation course from British Council partners.","tags":["ielts", "british council", "practice"],"is_official":True,"is_free":False,"language":"English"},
        {"name":"TST Prep TOEFL","category":"English Exams","subcategory":"TOEFL Strategy","skill":"All Skills","exam":"TOEFL","level":"Intermediate → Advanced","resource_type":"Video Lessons","url":"https://tstprep.com/","description":"TOEFL lessons, templates, and strategies.","tags":["toefl", "speaking", "writing", "strategy"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"TOEFL Resources","category":"English Exams","subcategory":"TOEFL Writing/Speaking","skill":"Writing, Speaking","exam":"TOEFL","level":"Intermediate → Advanced","resource_type":"Website","url":"https://www.toeflresources.com/","description":"TOEFL writing and speaking templates and sample answers.","tags":["toefl", "writing", "speaking"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"BestMyTest TOEFL","category":"English Exams","subcategory":"TOEFL Practice","skill":"All Skills","exam":"TOEFL","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://www.bestmytest.com/toefl","description":"TOEFL lessons and practice platform.","tags":["toefl", "practice"],"is_official":False,"is_free":False,"language":"English"},
        {"name":"Notefull TOEFL","category":"English Exams","subcategory":"TOEFL Strategy","skill":"All Skills","exam":"TOEFL","level":"Intermediate → Advanced","resource_type":"Video Lessons","url":"https://www.notefull.com/","description":"TOEFL strategies and preparation lessons.","tags":["toefl", "strategy"],"is_official":False,"is_free":False,"language":"English"},
        {"name":"ETS TOEFL Practice Sets","category":"English Exams","subcategory":"TOEFL Official Practice","skill":"All Skills","exam":"TOEFL","level":"All Levels","resource_type":"Official","url":"https://www.ets.org/toefl/test-takers/ibt/prepare/practice-tests.html","description":"Official TOEFL practice sets and test preparation.","tags":["toefl", "official", "ets", "practice"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Arno DET Practice","category":"English Exams","subcategory":"DET Practice","skill":"All Skills","exam":"Duolingo English Test","level":"All Levels","resource_type":"Practice","url":"https://goarno.io/","description":"Duolingo English Test practice platform and preparation guidance.","tags":["duolingo", "det", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"DET Ready","category":"English Exams","subcategory":"DET Practice","skill":"All Skills","exam":"Duolingo English Test","level":"All Levels","resource_type":"Practice","url":"https://detready.com/","description":"Practice resources for Duolingo English Test preparation.","tags":["duolingo", "det", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Teacher Luke DET","category":"English Exams","subcategory":"DET Strategy","skill":"Speaking, Writing","exam":"Duolingo English Test","level":"All Levels","resource_type":"Video Lessons","url":"https://www.youtube.com/@TeacherLukeDET","description":"Duolingo English Test tips and sample answers.","tags":["duolingo", "det", "speaking", "writing"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Duolingo English Test Blog","category":"English Exams","subcategory":"DET Official Guide","skill":"All Skills","exam":"Duolingo English Test","level":"All Levels","resource_type":"Official","url":"https://englishtest.duolingo.com/blog","description":"Official DET articles and preparation guidance.","tags":["duolingo", "official", "det"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Du Chinese","category":"Chinese & HSK","subcategory":"Reading","skill":"Chinese Reading, Vocabulary","exam":"HSK","level":"Beginner → Advanced","resource_type":"App","url":"https://duchinese.net/","description":"Chinese graded reading app useful for HSK and reading growth.","tags":["chinese", "hsk", "reading", "vocabulary"],"is_official":False,"is_free":False,"language":"Chinese"},
        {"name":"The Chairman's Bao","category":"Chinese & HSK","subcategory":"Reading","skill":"Chinese Reading, Vocabulary","exam":"HSK","level":"Beginner → Advanced","resource_type":"App","url":"https://www.thechairmansbao.com/","description":"Chinese news-based graded reading platform.","tags":["chinese", "hsk", "reading", "news"],"is_official":False,"is_free":False,"language":"Chinese"},
        {"name":"Chinese Zero to Hero","category":"Chinese & HSK","subcategory":"HSK Course","skill":"HSK Vocabulary, Grammar","exam":"HSK","level":"HSK 1 → HSK 6","resource_type":"Course","url":"https://www.chinesezerotohero.com/","description":"HSK courses and Chinese learning content.","tags":["chinese", "hsk", "course"],"is_official":False,"is_free":False,"language":"Chinese"},
        {"name":"Purple Culture","category":"Chinese & HSK","subcategory":"Tools","skill":"Dictionary, HSK, Characters","exam":"HSK","level":"All Levels","resource_type":"Tool","url":"https://www.purpleculture.net/","description":"Chinese dictionary, HSK tools, stroke order, and learning resources.","tags":["chinese", "hsk", "dictionary", "characters"],"is_official":False,"is_free":True,"language":"Chinese"},
        {"name":"Hack Chinese","category":"Chinese & HSK","subcategory":"Vocabulary","skill":"Chinese Vocabulary","exam":"HSK","level":"Beginner → Advanced","resource_type":"Tool","url":"https://www.hackchinese.com/","description":"Vocabulary retention system for Chinese learners.","tags":["chinese", "vocabulary", "hsk"],"is_official":False,"is_free":False,"language":"Chinese"},
        {"name":"Yoyo Chinese","category":"Chinese & HSK","subcategory":"Chinese Basics","skill":"Speaking, Pronunciation, Grammar","exam":"HSK","level":"Beginner → Intermediate","resource_type":"Course","url":"https://www.yoyochinese.com/","description":"Chinese lessons for beginners and intermediate learners.","tags":["chinese", "speaking", "pronunciation"],"is_official":False,"is_free":False,"language":"Chinese"},
        {"name":"College Board SAT","category":"SAT","subcategory":"Official SAT","skill":"SAT Math, Reading, Writing","exam":"SAT","level":"All Levels","resource_type":"Official","url":"https://satsuite.collegeboard.org/sat","description":"Official SAT information from College Board.","tags":["sat", "official", "college board"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Bluebook SAT App","category":"SAT","subcategory":"Official Practice","skill":"Full Digital SAT","exam":"SAT","level":"All Levels","resource_type":"Official App","url":"https://bluebook.collegeboard.org/","description":"Official app for digital SAT practice and test preview.","tags":["sat", "bluebook", "official", "practice"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Khan Academy SAT","category":"SAT","subcategory":"SAT Practice","skill":"SAT Math, Reading, Writing","exam":"SAT","level":"Beginner → Advanced","resource_type":"Official Practice","url":"https://www.khanacademy.org/test-prep/sat","description":"Official free SAT practice in partnership with College Board.","tags":["sat", "khan academy", "official", "math", "reading"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"SAT Suite Question Bank","category":"SAT","subcategory":"Official Questions","skill":"SAT Math, Reading, Writing","exam":"SAT","level":"All Levels","resource_type":"Official Question Bank","url":"https://satsuitequestionbank.collegeboard.org/","description":"Official SAT question bank for practice.","tags":["sat", "question bank", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Erica Meltzer SAT Reading","category":"SAT","subcategory":"SAT Reading/Writing","skill":"Reading, Writing","exam":"SAT","level":"Intermediate → Advanced","resource_type":"Guide","url":"https://thecriticalreader.com/","description":"SAT reading and writing resources by Erica Meltzer.","tags":["sat", "reading", "writing"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Scalar Learning SAT Math","category":"SAT","subcategory":"SAT Math","skill":"Math","exam":"SAT","level":"Beginner → Advanced","resource_type":"Video Lessons","url":"https://www.youtube.com/@ScalarLearning","description":"SAT math practice and explanations.","tags":["sat", "math", "video"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"PrepScholar SAT Blog","category":"SAT","subcategory":"SAT Strategy","skill":"SAT Math, Reading, Writing","exam":"SAT","level":"All Levels","resource_type":"Guide","url":"https://blog.prepscholar.com/topic/sat","description":"SAT guides, strategies, and study advice.","tags":["sat", "strategy", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"ACT Official","category":"ACT","subcategory":"Official ACT","skill":"ACT English, Math, Reading, Science","exam":"ACT","level":"All Levels","resource_type":"Official","url":"https://www.act.org/","description":"Official ACT information and test resources.","tags":["act", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"ACT Test Prep","category":"ACT","subcategory":"Official Practice","skill":"ACT English, Math, Reading, Science","exam":"ACT","level":"All Levels","resource_type":"Official Practice","url":"https://www.act.org/content/act/en/products-and-services/the-act/test-preparation.html","description":"Official ACT test preparation resources.","tags":["act", "official", "practice"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"CrackACT","category":"ACT","subcategory":"ACT Practice","skill":"ACT English, Math, Reading, Science","exam":"ACT","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://www.crackab.com/","description":"ACT practice tests and question sets.","tags":["act", "practice", "test"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"PrepScholar ACT Blog","category":"ACT","subcategory":"ACT Strategy","skill":"ACT English, Math, Reading, Science","exam":"ACT","level":"All Levels","resource_type":"Guide","url":"https://blog.prepscholar.com/topic/act","description":"ACT strategy and study resources.","tags":["act", "strategy"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Magoosh ACT Blog","category":"ACT","subcategory":"ACT Practice","skill":"ACT English, Math, Reading, Science","exam":"ACT","level":"All Levels","resource_type":"Guide","url":"https://magoosh.com/hs/act/","description":"ACT preparation guides and tips.","tags":["act", "magoosh", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"ETS GRE Official","category":"GRE","subcategory":"Official GRE","skill":"Quant, Verbal, Writing","exam":"GRE","level":"All Levels","resource_type":"Official","url":"https://www.ets.org/gre/test-takers/general-test/prepare.html","description":"Official GRE preparation resources from ETS.","tags":["gre", "official", "ets"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"GregMat","category":"GRE","subcategory":"GRE Strategy","skill":"Quant, Verbal, Writing","exam":"GRE","level":"Beginner → Advanced","resource_type":"Course","url":"https://www.gregmat.com/","description":"Popular GRE study platform with strategy and practice.","tags":["gre", "gregmat", "quant", "verbal"],"is_official":False,"is_free":False,"language":"English"},
        {"name":"Magoosh GRE Blog","category":"GRE","subcategory":"GRE Practice","skill":"Quant, Verbal, Writing","exam":"GRE","level":"All Levels","resource_type":"Guide","url":"https://magoosh.com/gre/","description":"GRE articles, study schedules, and practice advice.","tags":["gre", "magoosh", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Manhattan Prep GRE","category":"GRE","subcategory":"GRE Strategy","skill":"Quant, Verbal, Writing","exam":"GRE","level":"Intermediate → Advanced","resource_type":"Guide","url":"https://www.manhattanprep.com/gre/","description":"GRE preparation resources and strategy articles.","tags":["gre", "manhattan", "strategy"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"GRE Prep Club","category":"GRE","subcategory":"GRE Practice","skill":"Quant, Verbal, Writing","exam":"GRE","level":"Intermediate → Advanced","resource_type":"Community","url":"https://greprepclub.com/","description":"GRE questions, explanations, and prep community.","tags":["gre", "practice", "community"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"GMAT Official","category":"GMAT","subcategory":"Official GMAT","skill":"Quant, Verbal, Data Insights","exam":"GMAT","level":"All Levels","resource_type":"Official","url":"https://www.mba.com/exams/gmat-exam/prepare","description":"Official GMAT preparation resources.","tags":["gmat", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"GMAT Club","category":"GMAT","subcategory":"GMAT Practice","skill":"Quant, Verbal, Data Insights","exam":"GMAT","level":"Beginner → Advanced","resource_type":"Community","url":"https://gmatclub.com/","description":"GMAT forum, questions, explanations, and study resources.","tags":["gmat", "practice", "community"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Manhattan Prep GMAT","category":"GMAT","subcategory":"GMAT Strategy","skill":"Quant, Verbal","exam":"GMAT","level":"Intermediate → Advanced","resource_type":"Guide","url":"https://www.manhattanprep.com/gmat/","description":"GMAT preparation resources and strategies.","tags":["gmat", "strategy"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Target Test Prep GMAT","category":"GMAT","subcategory":"GMAT Quant","skill":"Quant","exam":"GMAT","level":"Intermediate → Advanced","resource_type":"Course","url":"https://gmat.targettestprep.com/","description":"GMAT quant-focused preparation platform.","tags":["gmat", "quant"],"is_official":False,"is_free":False,"language":"English"},
        {"name":"Magoosh GMAT Blog","category":"GMAT","subcategory":"GMAT Practice","skill":"Quant, Verbal","exam":"GMAT","level":"All Levels","resource_type":"Guide","url":"https://magoosh.com/gmat/","description":"GMAT guides, practice advice, and study planning.","tags":["gmat", "magoosh"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Brilliant","category":"Mathematics","subcategory":"Problem Solving","skill":"Math, Logic, Computer Science","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://brilliant.org/","description":"Interactive math, science, and CS learning platform.","tags":["math", "problem solving", "logic"],"is_official":False,"is_free":False,"language":"English"},
        {"name":"Art of Problem Solving","category":"Mathematics","subcategory":"Olympiad Math","skill":"Problem Solving, Algebra, Geometry","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://artofproblemsolving.com/","description":"Advanced math problem solving and community.","tags":["math", "olympiad", "problem solving"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Professor Leonard","category":"Mathematics","subcategory":"Calculus","skill":"Calculus, Algebra","exam":"","level":"Beginner → Advanced","resource_type":"Video Lessons","url":"https://www.youtube.com/@ProfessorLeonard","description":"Clear full-length math lectures for algebra and calculus.","tags":["math", "calculus", "algebra"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Automate the Boring Stuff","category":"Programming & Technology","subcategory":"Python","skill":"Python, Automation","exam":"","level":"Beginner","resource_type":"Book","url":"https://automatetheboringstuff.com/","description":"Free Python book focused on practical automation.","tags":["python", "automation", "book"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Real Python","category":"Programming & Technology","subcategory":"Python","skill":"Python, Flask, Projects","exam":"","level":"Beginner → Advanced","resource_type":"Website","url":"https://realpython.com/","description":"High-quality Python tutorials and project guides.","tags":["python", "flask", "projects"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Python Docs","category":"Programming & Technology","subcategory":"Python Documentation","skill":"Python","exam":"","level":"All Levels","resource_type":"Documentation","url":"https://docs.python.org/3/","description":"Official Python documentation.","tags":["python", "official", "documentation"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"JavaScript.info","category":"Programming & Technology","subcategory":"JavaScript","skill":"JavaScript, Web Development","exam":"","level":"Beginner → Advanced","resource_type":"Documentation","url":"https://javascript.info/","description":"Modern JavaScript tutorial from basics to advanced topics.","tags":["javascript", "web development"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"W3Schools","category":"Programming & Technology","subcategory":"Web Development","skill":"HTML, CSS, JavaScript, SQL","exam":"","level":"Beginner","resource_type":"Practice","url":"https://www.w3schools.com/","description":"Beginner-friendly tutorials and examples for web technologies.","tags":["html", "css", "javascript", "sql"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"SQLZoo","category":"Programming & Technology","subcategory":"SQL","skill":"SQL, Databases","exam":"","level":"Beginner → Intermediate","resource_type":"Practice","url":"https://sqlzoo.net/","description":"Interactive SQL tutorial and exercises.","tags":["sql", "database", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Mode SQL Tutorial","category":"Programming & Technology","subcategory":"SQL","skill":"SQL, Analytics","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://mode.com/sql-tutorial/","description":"SQL tutorial for analytics and data work.","tags":["sql", "analytics", "data"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"PostgreSQL Docs","category":"Programming & Technology","subcategory":"Databases","skill":"PostgreSQL, SQL","exam":"","level":"All Levels","resource_type":"Documentation","url":"https://www.postgresql.org/docs/","description":"Official PostgreSQL documentation.","tags":["postgresql", "sql", "database", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"CSES Problem Set","category":"Programming & Technology","subcategory":"Algorithms","skill":"Algorithms, Data Structures","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://cses.fi/problemset/","description":"Structured algorithmic problem set for competitive programming.","tags":["algorithms", "data structures", "practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"AtCoder","category":"Programming & Technology","subcategory":"Competitive Programming","skill":"Problem Solving, Algorithms","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://atcoder.jp/","description":"Competitive programming contests and practice.","tags":["algorithms", "competitive programming"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"HackerRank","category":"Programming & Technology","subcategory":"Problem Solving","skill":"Programming, SQL, Algorithms","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://www.hackerrank.com/","description":"Practice programming, SQL, and algorithms.","tags":["programming", "sql", "algorithms"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Türkiye Scholarships","category":"Scholarships","subcategory":"Government Scholarship","skill":"Application, Interview, Documents","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://www.turkiyeburslari.gov.tr/","description":"Official Türkiye Scholarships portal.","tags":["scholarship", "turkey", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"MEXT Scholarship","category":"Scholarships","subcategory":"Government Scholarship","skill":"Application, Embassy, Documents","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/","description":"Official MEXT scholarship information for Japan.","tags":["scholarship", "japan", "mext", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Chevening Scholarships","category":"Scholarships","subcategory":"Government Scholarship","skill":"Leadership, Application, Essays","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://www.chevening.org/","description":"Official UK Chevening Scholarships website.","tags":["scholarship", "uk", "chevening", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Fulbright Program","category":"Scholarships","subcategory":"Government Scholarship","skill":"Application, Essays, Interview","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://foreign.fulbrightonline.org/","description":"Official Fulbright foreign student program website.","tags":["scholarship", "fulbright", "usa", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Erasmus Mundus Catalogue","category":"Scholarships","subcategory":"Government Scholarship","skill":"Master Programs, Application","exam":"","level":"All Levels","resource_type":"Official Search","url":"https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en","description":"Official Erasmus Mundus catalogue.","tags":["scholarship", "erasmus", "europe", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Commonwealth Scholarships","category":"Scholarships","subcategory":"Government Scholarship","skill":"Application, Documents","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://cscuk.fcdo.gov.uk/scholarships/","description":"Official Commonwealth Scholarships website.","tags":["scholarship", "commonwealth", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Stipendium Hungaricum","category":"Scholarships","subcategory":"Government Scholarship","skill":"Application, Hungary","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://stipendiumhungaricum.hu/","description":"Official Hungarian government scholarship website.","tags":["scholarship", "hungary", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Study in Korea Scholarships","category":"Scholarships","subcategory":"Government Scholarship","skill":"Application, Korea","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://www.studyinkorea.go.kr/","description":"Official Study in Korea portal.","tags":["scholarship", "korea", "official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Motivation Letter Guide - MastersPortal","category":"Scholarships","subcategory":"Motivation Letter","skill":"Writing, Application","exam":"","level":"All Levels","resource_type":"Guide","url":"https://www.mastersportal.com/articles/2821/how-to-write-a-motivation-letter.html","description":"Practical motivation letter writing guide.","tags":["motivation letter", "scholarship", "writing"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Tarteel AI","category":"Islamic Learning","subcategory":"Quran Memorization","skill":"Memorization, Recitation Correction","exam":"","level":"All Levels","resource_type":"App","url":"https://www.tarteel.ai/","description":"AI Quran memorization and recitation support app.","tags":["quran", "memorization", "recitation", "ai", "حفظ"],"is_official":False,"is_free":False,"language":"Arabic"},
        {"name":"Quran Revolution","category":"Islamic Learning","subcategory":"Tajweed","skill":"Tajweed, Recitation","exam":"","level":"Beginner → Advanced","resource_type":"Course","url":"https://quranrevolution.com/","description":"Quran recitation and tajweed learning platform.","tags":["quran", "tajweed", "recitation", "تجويد"],"is_official":False,"is_free":False,"language":"Arabic/English"},
        {"name":"Bayyinah TV","category":"Islamic Learning","subcategory":"Quran Understanding","skill":"Arabic, Tafsir, Quran","exam":"","level":"Beginner → Advanced","resource_type":"Course","url":"https://bayyinahtv.com/","description":"Quran Arabic and understanding resources.","tags":["quran", "arabic", "tafsir"],"is_official":False,"is_free":False,"language":"English/Arabic"},
        {"name":"Dorar","category":"Islamic Learning","subcategory":"Hadith Verification","skill":"Hadith, Islamic Research","exam":"","level":"All Levels","resource_type":"Library","url":"https://dorar.net/","description":"Arabic hadith and Islamic research database.","tags":["hadith", "حديث", "Arabic"],"is_official":False,"is_free":True,"language":"Arabic"},
        {"name":"المكتبة الشاملة","category":"Islamic Learning","subcategory":"Islamic Library","skill":"Fiqh, Hadith, Tafsir, Arabic","exam":"","level":"Advanced","resource_type":"Library","url":"https://shamela.ws/","description":"Large Arabic Islamic library for advanced study.","tags":["islamic", "arabic", "library", "fiqh", "tafsir"],"is_official":False,"is_free":True,"language":"Arabic"},
        {"name":"Altafsir","category":"Islamic Learning","subcategory":"Tafsir","skill":"Tafsir, Quran Understanding","exam":"","level":"Intermediate → Advanced","resource_type":"Library","url":"https://www.altafsir.com/","description":"Quran tafsir resources in Arabic and other languages.","tags":["tafsir", "quran", "Arabic"],"is_official":False,"is_free":True,"language":"Arabic"},

        # English skills
        {"name":"BBC Learning English","category":"English Skills","subcategory":"General English","skill":"Listening, Vocabulary, Pronunciation","exam":"","level":"Beginner → Advanced","resource_type":"Website","url":"https://www.bbc.co.uk/learningenglish","description":"Structured free lessons for listening, vocabulary, pronunciation, and everyday English.","tags":["english","listening","vocabulary","pronunciation","free"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"VOA Learning English","category":"English Skills","subcategory":"General English","skill":"Listening, Reading, Vocabulary","exam":"","level":"Beginner → Intermediate","resource_type":"Website","url":"https://learningenglish.voanews.com/","description":"Slow English news and learning programs for listening and vocabulary.","tags":["english","listening","reading","news"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"ELLLO","category":"English Skills","subcategory":"Listening","skill":"Listening, Speaking","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://www.elllo.org/","description":"Large library of real listening conversations with transcripts and quizzes.","tags":["english","listening","speaking","conversation"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"ReadTheory","category":"English Skills","subcategory":"Reading","skill":"Reading Comprehension","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://readtheory.org/","description":"Adaptive reading comprehension practice useful before IELTS/TOEFL reading.","tags":["english","reading","comprehension","practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Cambridge Dictionary","category":"English Skills","subcategory":"Vocabulary","skill":"Vocabulary, Pronunciation","exam":"","level":"All Levels","resource_type":"Dictionary","url":"https://dictionary.cambridge.org/","description":"Reliable definitions, examples, pronunciation, and vocabulary support.","tags":["english","vocabulary","dictionary","pronunciation"],"is_official":False,"is_free":True,"language":"English"},

        # English exams
        {"name":"IELTS Official","category":"English Exams","subcategory":"Official IELTS","skill":"All Skills","exam":"IELTS","level":"All Levels","resource_type":"Official","url":"https://ielts.org/","description":"Official IELTS information, test format, and practice resources.","tags":["ielts","official","listening","reading","writing","speaking"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"British Council IELTS Practice","category":"English Exams","subcategory":"IELTS Practice","skill":"All Skills","exam":"IELTS","level":"Beginner → Advanced","resource_type":"Practice","url":"https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests","description":"Free IELTS practice materials from the British Council.","tags":["ielts","british council","practice","mock test"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"IELTS Liz","category":"English Exams","subcategory":"IELTS Strategy","skill":"Writing, Speaking, Reading, Listening","exam":"IELTS","level":"Intermediate → Advanced","resource_type":"Website","url":"https://ieltsliz.com/","description":"Clear IELTS tips, model answers, and strategies for all skills.","tags":["ielts","writing","speaking","strategy"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"TOEFL TestReady","category":"English Exams","subcategory":"Official TOEFL","skill":"All Skills","exam":"TOEFL","level":"All Levels","resource_type":"Official","url":"https://www.ets.org/toefl/test-takers/ibt/prepare.html","description":"Official TOEFL preparation resources from ETS.","tags":["toefl","official","ets","reading","listening","writing","speaking"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Duolingo English Test Official Practice","category":"English Exams","subcategory":"Official DET","skill":"All Skills","exam":"Duolingo English Test","level":"All Levels","resource_type":"Official","url":"https://englishtest.duolingo.com/practice","description":"Official Duolingo English Test practice and test readiness resources.","tags":["duolingo","det","official","practice"],"is_official":True,"is_free":True,"language":"English"},

        # Chinese / HSK / CSCA
        {"name":"HSK Official Test Info","category":"Chinese & HSK","subcategory":"HSK","skill":"Chinese Test","exam":"HSK","level":"HSK 1 → HSK 6","resource_type":"Official","url":"https://www.chinesetest.cn/","description":"Official Chinese test information and services.","tags":["chinese","hsk","official"],"is_official":True,"is_free":True,"language":"Chinese"},
        {"name":"HelloChinese","category":"Chinese & HSK","subcategory":"Chinese Basics","skill":"Vocabulary, Pronunciation, Characters","exam":"HSK","level":"Beginner","resource_type":"App","url":"https://www.hellochinese.cc/","description":"Beginner-friendly Chinese learning app for pronunciation, characters, and vocabulary.","tags":["chinese","hsk","vocabulary","app"],"is_official":False,"is_free":True,"language":"Chinese"},
        {"name":"CSCA Official Portal","category":"CSCA","subcategory":"Official CSCA","skill":"Mathematics, Physics, Chemistry","exam":"CSCA","level":"Admission Exam","resource_type":"Official","url":"https://www.csca.cn/","description":"Official CSCA exam information portal when accessible.","tags":["csca","mathematics","physics","chemistry","official"],"is_official":True,"is_free":True,"language":"Chinese/English"},
        {"name":"Khan Academy Mathematics","category":"CSCA","subcategory":"Mathematics","skill":"Algebra, Functions, Geometry, Probability","exam":"CSCA","level":"Beginner → Advanced","resource_type":"Course","url":"https://www.khanacademy.org/math","description":"Strong free math practice useful for CSCA mathematics foundations.","tags":["csca","math","algebra","geometry","probability"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Physics","category":"CSCA","subcategory":"Physics","skill":"Mechanics, Electricity, Waves","exam":"CSCA","level":"Beginner → Advanced","resource_type":"Course","url":"https://www.khanacademy.org/science/physics","description":"Free physics foundations useful for CSCA physics preparation.","tags":["csca","physics","mechanics","electricity"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Khan Academy Chemistry","category":"CSCA","subcategory":"Chemistry","skill":"Chemical Concepts, Reactions, Equilibrium","exam":"CSCA","level":"Beginner → Advanced","resource_type":"Course","url":"https://www.khanacademy.org/science/chemistry","description":"Free chemistry foundations useful for CSCA chemistry preparation.","tags":["csca","chemistry","mole","equilibrium"],"is_official":False,"is_free":True,"language":"English"},

        # Programming & AI
        {"name":"CS50x","category":"Programming & Technology","subcategory":"Computer Science","skill":"Programming, Algorithms, C, Python","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://cs50.harvard.edu/x/","description":"Harvard's free introduction to computer science and programming.","tags":["cs50","programming","algorithms","python","c"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Python for Everybody","category":"Programming & Technology","subcategory":"Python","skill":"Python Basics","exam":"","level":"Beginner","resource_type":"Course","url":"https://www.py4e.com/","description":"Beginner-friendly Python course by Dr. Chuck.","tags":["python","beginner","programming"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"freeCodeCamp","category":"Programming & Technology","subcategory":"Web Development","skill":"HTML, CSS, JavaScript, Projects","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://www.freecodecamp.org/","description":"Free interactive coding curriculum and projects.","tags":["web development","html","css","javascript","projects"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"MDN Web Docs","category":"Programming & Technology","subcategory":"Documentation","skill":"HTML, CSS, JavaScript, Web APIs","exam":"","level":"All Levels","resource_type":"Documentation","url":"https://developer.mozilla.org/","description":"High-quality web development documentation from MDN.","tags":["documentation","html","css","javascript","web"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Kaggle Learn","category":"AI & Data Science","subcategory":"Data Science","skill":"Python, Pandas, Machine Learning","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://www.kaggle.com/learn","description":"Short practical courses for Python, SQL, pandas, ML, and data visualization.","tags":["ai","data science","python","machine learning","sql"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Google Machine Learning Crash Course","category":"AI & Data Science","subcategory":"Machine Learning","skill":"ML Concepts","exam":"","level":"Beginner → Intermediate","resource_type":"Course","url":"https://developers.google.com/machine-learning/crash-course","description":"Google's free introduction to machine learning concepts and practice.","tags":["machine learning","ai","google","course"],"is_official":True,"is_free":True,"language":"English"},

        # Scholarships
        {"name":"ScholarshipPortal","category":"Scholarships","subcategory":"Scholarship Search","skill":"Search, Compare","exam":"","level":"All Levels","resource_type":"Search Tool","url":"https://www.scholarshipportal.com/","description":"Search engine for scholarships around the world.","tags":["scholarship","search","university"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Studyportals","category":"Scholarships","subcategory":"University Research","skill":"University Search","exam":"","level":"All Levels","resource_type":"Search Tool","url":"https://www.studyportals.com/","description":"Explore international study programs and universities.","tags":["university","study abroad","scholarship"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Europass CV","category":"Scholarships","subcategory":"CV","skill":"CV Preparation","exam":"","level":"All Levels","resource_type":"Tool","url":"https://europa.eu/europass/en/create-europass-cv","description":"Free CV builder useful for scholarship applications.","tags":["cv","scholarship","documents"],"is_official":True,"is_free":True,"language":"English"},

        # Islamic Learning
        {"name":"Quran.com","category":"Islamic Learning","subcategory":"Quran","skill":"Recitation, Reading, Translation","exam":"","level":"All Levels","resource_type":"Website","url":"https://quran.com/","description":"Quran reading, recitations, translations, and study support.","tags":["quran","قرآن","recitation","translation"],"is_official":False,"is_free":True,"language":"Arabic"},
        {"name":"Tanzil Quran","category":"Islamic Learning","subcategory":"Quran Text","skill":"Quran Text","exam":"","level":"All Levels","resource_type":"Website","url":"https://tanzil.net/","description":"Reliable Quran text and translations.","tags":["quran","قرآن","text"],"is_official":False,"is_free":True,"language":"Arabic"},
        {"name":"Sunnah.com","category":"Islamic Learning","subcategory":"Hadith","skill":"Hadith Reading","exam":"","level":"All Levels","resource_type":"Website","url":"https://sunnah.com/","description":"Hadith collections in searchable format.","tags":["hadith","حديث","islamic"],"is_official":False,"is_free":True,"language":"Arabic/English"},

        # More English Skills
        {"name":"Perfect English Grammar","category":"English Skills","subcategory":"Grammar","skill":"Grammar","exam":"","level":"Beginner → Advanced","resource_type":"Website","url":"https://www.perfect-english-grammar.com/","description":"Clear grammar explanations and exercises for English learners.","tags":["english","grammar","practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Oxford Online English","category":"English Skills","subcategory":"Speaking & Writing","skill":"Speaking, Writing, Pronunciation","exam":"","level":"Beginner → Advanced","resource_type":"Video Lessons","url":"https://www.oxfordonlineenglish.com/free-english-lessons","description":"Free English lessons for speaking, pronunciation, writing, and grammar.","tags":["english","speaking","writing","pronunciation"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"English Club","category":"English Skills","subcategory":"General English","skill":"Grammar, Vocabulary, Listening, Speaking","exam":"","level":"Beginner → Advanced","resource_type":"Website","url":"https://www.englishclub.com/","description":"Large free English learning website covering many skills.","tags":["english","grammar","vocabulary","listening","speaking"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"ESL Lab","category":"English Skills","subcategory":"Listening","skill":"Listening","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://www.esl-lab.com/","description":"Listening practice with quizzes and real-life situations.","tags":["english","listening","practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"YouGlish","category":"English Skills","subcategory":"Pronunciation","skill":"Pronunciation, Listening","exam":"","level":"All Levels","resource_type":"Tool","url":"https://youglish.com/","description":"Search words and hear real pronunciation examples from videos.","tags":["english","pronunciation","listening"],"is_official":False,"is_free":True,"language":"English"},

        # More English Exams
        {"name":"Cambridge IELTS Practice","category":"English Exams","subcategory":"IELTS Practice","skill":"Reading, Listening, Writing, Speaking","exam":"IELTS","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://www.cambridgeenglish.org/learning-english/exam-preparation/","description":"Cambridge exam preparation resources and practice support.","tags":["ielts","cambridge","practice"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Magoosh TOEFL Blog","category":"English Exams","subcategory":"TOEFL Strategy","skill":"Reading, Listening, Writing, Speaking","exam":"TOEFL","level":"Intermediate → Advanced","resource_type":"Website","url":"https://magoosh.com/toefl/","description":"TOEFL strategy articles, study plans, and practice advice.","tags":["toefl","strategy","practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"TestGlider TOEFL Resources","category":"English Exams","subcategory":"TOEFL Practice","skill":"All Skills","exam":"TOEFL","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://www.testglider.com/blog","description":"TOEFL preparation articles and practice guidance.","tags":["toefl","practice","mock"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Duolingo English Test Readiness Guide","category":"English Exams","subcategory":"DET Guide","skill":"All Skills","exam":"Duolingo English Test","level":"All Levels","resource_type":"Official","url":"https://englishtest.duolingo.com/readiness","description":"Official readiness and preparation guidance for the Duolingo English Test.","tags":["duolingo","det","official","readiness"],"is_official":True,"is_free":True,"language":"English"},

        # Chinese and HSK
        {"name":"Mandarin Bean","category":"Chinese & HSK","subcategory":"Reading","skill":"Chinese Reading, Vocabulary","exam":"HSK","level":"HSK 1 → HSK 6","resource_type":"Practice","url":"https://mandarinbean.com/","description":"Chinese reading practice by HSK level with vocabulary support.","tags":["chinese","hsk","reading","vocabulary"],"is_official":False,"is_free":True,"language":"Chinese"},
        {"name":"Chinese Grammar Wiki","category":"Chinese & HSK","subcategory":"Grammar","skill":"Chinese Grammar","exam":"HSK","level":"Beginner → Advanced","resource_type":"Documentation","url":"https://resources.allsetlearning.com/chinese/grammar/","description":"Clear Chinese grammar explanations by level.","tags":["chinese","grammar","hsk"],"is_official":False,"is_free":True,"language":"English/Chinese"},
        {"name":"HSK Academy","category":"Chinese & HSK","subcategory":"HSK Vocabulary","skill":"Vocabulary, Characters","exam":"HSK","level":"HSK 1 → HSK 6","resource_type":"Practice","url":"https://hsk.academy/","description":"HSK vocabulary lists and practice tools.","tags":["hsk","vocabulary","characters"],"is_official":False,"is_free":True,"language":"Chinese"},
        {"name":"Arch Chinese","category":"Chinese & HSK","subcategory":"Characters","skill":"Characters, Stroke Order","exam":"HSK","level":"Beginner → Advanced","resource_type":"Tool","url":"https://www.archchinese.com/","description":"Chinese character worksheets, stroke order, and vocabulary tools.","tags":["chinese","characters","stroke order"],"is_official":False,"is_free":True,"language":"English/Chinese"},

        # CSCA expanded foundations
        {"name":"Paul's Online Math Notes","category":"CSCA","subcategory":"Mathematics","skill":"Algebra, Calculus, Functions","exam":"CSCA","level":"Intermediate → Advanced","resource_type":"Notes","url":"https://tutorial.math.lamar.edu/","description":"Strong math notes and examples for algebra and calculus foundations.","tags":["csca","math","functions","calculus"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"OpenStax Physics","category":"CSCA","subcategory":"Physics","skill":"Mechanics, Electricity, Thermodynamics, Optics","exam":"CSCA","level":"Intermediate → Advanced","resource_type":"Book","url":"https://openstax.org/details/books/college-physics-2e","description":"Free physics textbook covering mechanics, electricity, waves, and optics.","tags":["csca","physics","mechanics","thermodynamics","optics"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"OpenStax Chemistry","category":"CSCA","subcategory":"Chemistry","skill":"Chemical Concepts, Reactions, Equilibrium","exam":"CSCA","level":"Intermediate → Advanced","resource_type":"Book","url":"https://openstax.org/details/books/chemistry-2e","description":"Free chemistry textbook covering chemical concepts, calculations, and reactions.","tags":["csca","chemistry","equilibrium","reactions"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"PhET Simulations","category":"CSCA","subcategory":"Science Simulations","skill":"Physics, Chemistry","exam":"CSCA","level":"Beginner → Advanced","resource_type":"Simulation","url":"https://phet.colorado.edu/","description":"Interactive simulations for physics and chemistry concepts.","tags":["physics","chemistry","simulation","csca"],"is_official":True,"is_free":True,"language":"English"},

        # Programming expanded
        {"name":"The Odin Project","category":"Programming & Technology","subcategory":"Full Stack Web","skill":"HTML, CSS, JavaScript, Git, Backend","exam":"","level":"Beginner → Advanced","resource_type":"Course","url":"https://www.theodinproject.com/","description":"Full-stack web development curriculum with projects.","tags":["web development","full stack","javascript","git"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Flask Documentation","category":"Programming & Technology","subcategory":"Flask","skill":"Flask, Backend, Web Apps","exam":"","level":"Beginner → Advanced","resource_type":"Documentation","url":"https://flask.palletsprojects.com/","description":"Official Flask documentation for building Python web applications.","tags":["flask","python","backend","web app"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"SQLBolt","category":"Programming & Technology","subcategory":"SQL","skill":"SQL, Databases","exam":"","level":"Beginner","resource_type":"Practice","url":"https://sqlbolt.com/","description":"Interactive SQL lessons and exercises.","tags":["sql","database","practice"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"LeetCode","category":"Programming & Technology","subcategory":"Problem Solving","skill":"Algorithms, Data Structures","exam":"","level":"Beginner → Advanced","resource_type":"Practice","url":"https://leetcode.com/","description":"Coding problem practice for algorithms and data structures.","tags":["algorithms","data structures","problem solving"],"is_official":False,"is_free":True,"language":"English"},
        {"name":"Codeforces","category":"Programming & Technology","subcategory":"Competitive Programming","skill":"Problem Solving, Algorithms","exam":"","level":"Intermediate → Advanced","resource_type":"Practice","url":"https://codeforces.com/","description":"Competitive programming platform for algorithmic problem solving.","tags":["algorithms","problem solving","competitive programming"],"is_official":False,"is_free":True,"language":"English"},

        # AI expanded
        {"name":"Elements of AI","category":"AI & Data Science","subcategory":"AI Fundamentals","skill":"AI Concepts","exam":"","level":"Beginner","resource_type":"Course","url":"https://www.elementsofai.com/","description":"Beginner-friendly AI course explaining key concepts without heavy math.","tags":["ai","fundamentals","beginner"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"fast.ai Practical Deep Learning","category":"AI & Data Science","subcategory":"Deep Learning","skill":"Deep Learning, Projects","exam":"","level":"Intermediate","resource_type":"Course","url":"https://course.fast.ai/","description":"Practical deep learning course focused on building useful models.","tags":["deep learning","ai","projects"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Pandas Documentation","category":"AI & Data Science","subcategory":"Data Analysis","skill":"Pandas, Data Analysis","exam":"","level":"Beginner → Advanced","resource_type":"Documentation","url":"https://pandas.pydata.org/docs/","description":"Official pandas documentation for data analysis in Python.","tags":["pandas","data analysis","python"],"is_official":True,"is_free":True,"language":"English"},

        # Scholarships expanded
        {"name":"DAAD Scholarship Database","category":"Scholarships","subcategory":"Scholarship Search","skill":"Search, Eligibility","exam":"","level":"All Levels","resource_type":"Official Search","url":"https://www.daad.de/en/study-and-research-in-germany/scholarships/","description":"Official DAAD scholarship database for Germany.","tags":["scholarship","germany","daad","official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Campus France Scholarships","category":"Scholarships","subcategory":"Scholarship Search","skill":"Search, University Research","exam":"","level":"All Levels","resource_type":"Official Search","url":"https://www.campusfrance.org/en/bursaries-foreign-students","description":"Official scholarship information for studying in France.","tags":["scholarship","france","official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Study in China CSC","category":"Scholarships","subcategory":"Chinese Scholarship","skill":"Scholarship Search, Application","exam":"","level":"All Levels","resource_type":"Official Portal","url":"https://www.campuschina.org/","description":"Official Campus China portal for Chinese government scholarship information.","tags":["china","scholarship","csc","official"],"is_official":True,"is_free":True,"language":"English"},
        {"name":"Common App Essay Guide","category":"Scholarships","subcategory":"Personal Statement","skill":"Essay Writing","exam":"","level":"All Levels","resource_type":"Guide","url":"https://www.commonapp.org/apply/essay-prompts","description":"Official essay prompts and guidance useful for application writing practice.","tags":["essay","personal statement","application"],"is_official":True,"is_free":True,"language":"English"},

        # Islamic expanded
        {"name":"Ayah by Quran.com","category":"Islamic Learning","subcategory":"Quran Memorization","skill":"Memorization, Recitation","exam":"","level":"All Levels","resource_type":"App","url":"https://ayah.app/","description":"Beautiful Quran app useful for reading, listening, and memorization.","tags":["quran","memorization","recitation","قرآن","حفظ"],"is_official":False,"is_free":True,"language":"Arabic"},
        {"name":"Quranicaudio","category":"Islamic Learning","subcategory":"Quran Recitation","skill":"Listening, Recitation, Memorization","exam":"","level":"All Levels","resource_type":"Audio","url":"https://quranicaudio.com/","description":"Large collection of Quran recitations useful for memorization and revision.","tags":["quran","audio","recitation","حفظ","مراجعة"],"is_official":False,"is_free":True,"language":"Arabic"},
        {"name":"IslamHouse","category":"Islamic Learning","subcategory":"Islamic Studies","skill":"Aqeedah, Fiqh, Seerah","exam":"","level":"All Levels","resource_type":"Library","url":"https://islamhouse.com/","description":"Large Islamic content library in many languages.","tags":["islamic","aqeedah","fiqh","seerah","Arabic"],"is_official":False,"is_free":True,"language":"Arabic/English"},

    ]


def seed_learning_resources():
    try:
        existing_names = {name for (name,) in db.session.query(LearningResource.name).all()}
        added = 0
        for item in default_learning_resources():
            if item["name"] in existing_names:
                continue
            db.session.add(LearningResource(
                name=item["name"],
                category=item["category"],
                subcategory=item.get("subcategory", ""),
                skill=item.get("skill", ""),
                exam=item.get("exam", ""),
                level=item.get("level", ""),
                resource_type=item.get("resource_type", ""),
                url=item["url"],
                description=item.get("description", ""),
                tags_json=json.dumps(item.get("tags", []), ensure_ascii=False),
                is_official=bool(item.get("is_official", False)),
                is_free=bool(item.get("is_free", True)),
                language=item.get("language", ""),
            ))
            added += 1
        if added:
            db.session.commit()
            logger.info("Learning resources seeded/updated: %s new resources", added)
    except Exception:
        logger.exception("Failed to seed learning resources")




def build_resource_learning_path(category="", exam="", skill="", level=""):
    key = " ".join([category or "", exam or "", skill or "", level or ""]).lower()

    paths = {
        "ielts": ["BBC Learning English", "ReadTheory", "Breaking News English", "IELTS Liz", "IELTS Advantage", "British Council IELTS Practice"],
        "toefl": ["BBC Learning English", "TOEFL TestReady", "TST Prep TOEFL", "TOEFL Resources", "ETS TOEFL Practice Sets"],
        "duolingo": ["Duolingo English Test Official Practice", "Duolingo English Test Readiness Guide", "Arno DET Practice", "Teacher Luke DET"],
        "sat": ["College Board SAT", "Bluebook SAT App", "Khan Academy SAT", "SAT Suite Question Bank", "Erica Meltzer SAT Reading", "Scalar Learning SAT Math"],
        "act": ["ACT Official", "ACT Test Prep", "CrackACT", "PrepScholar ACT Blog"],
        "gre": ["ETS GRE Official", "GregMat", "Magoosh GRE Blog", "Manhattan Prep GRE", "GRE Prep Club"],
        "gmat": ["GMAT Official", "GMAT Club", "Manhattan Prep GMAT", "Magoosh GMAT Blog"],
        "hsk": ["HSK Official Test Info", "HelloChinese", "Mandarin Bean", "Chinese Grammar Wiki", "HSK Academy", "Du Chinese"],
        "csca": ["Khan Academy Mathematics", "Khan Academy Physics", "Khan Academy Chemistry", "OpenStax Physics", "OpenStax Chemistry", "PhET Simulations"],
        "mathematics": ["Khan Academy Math", "Math Is Fun", "Khan Academy Algebra 1", "GeoGebra", "Paul's Online Math Notes", "OpenStax Calculus Volume 1"],
        "keyboard typing": ["TypingClub", "Typing.com", "Ratatype", "Keybr", "Monkeytype", "TypeRacer"],
        "python": ["Python for Everybody", "Automate the Boring Stuff", "Python Docs", "Real Python", "Kaggle Learn"],
        "flask": ["Python for Everybody", "Flask Documentation", "Real Python", "CS50x"],
        "scholarship": ["ScholarshipPortal", "Studyportals", "Europass CV", "Study in China CSC", "Türkiye Scholarships", "DAAD Scholarship Database"],
        "quran": ["Quran.com", "Ayah by Quran.com", "Quranicaudio", "Tarteel AI", "Tanzil Quran"],
    }

    selected_key = None
    for k in paths:
        if k in key:
            selected_key = k
            break

    if not selected_key:
        if category:
            selected_key = category.lower()

    names = paths.get(selected_key, [])
    result = []
    for name in names:
        resource = LearningResource.query.filter_by(name=name).first()
        if resource:
            result.append(resource)
    return result



def resource_match_score(resource, text):
    text = (text or "").lower()
    searchable = " ".join([
        resource.name or "",
        resource.category or "",
        resource.subcategory or "",
        resource.skill or "",
        resource.exam or "",
        resource.description or "",
        " ".join(resource.tags),
    ]).lower()

    score = 0
    for token in tokenize_mixed_text(text):
        if token.lower() in searchable:
            score += 10
    return min(score, 100)




def render_clickable_sources(value):
    """Render source text safely: plain text stays plain, URLs become clickable links.
    Multiple sources can be separated by &.
    """
    if not value:
        return Markup('<span class="muted">not set</span>')

    parts = [part.strip() for part in str(value).split("&") if part.strip()]
    if not parts:
        return Markup('<span class="muted">not set</span>')

    rendered = []
    url_re = re.compile(r"^https?://[^\s]+$", re.IGNORECASE)

    for part in parts:
        safe_text = escape(part)
        if url_re.match(part):
            rendered.append(
                f'<a class="task-source-link" href="{safe_text}" target="_blank" rel="noopener noreferrer">{safe_text}</a>'
            )
        else:
            rendered.append(f'<span class="task-source-text">{safe_text}</span>')

    return Markup('<span class="task-source-list">' + '<span class="source-separator">&</span>'.join(rendered) + '</span>')




def ensure_all_users_subscription_codes():
    try:
        changed = False
        for user in User.query.all():
            if user.task_limit is None:
                user.task_limit = 20
            if user.goal_limit is None:
                user.goal_limit = 5
            if user.paid_ai_daily_limit is None:
                user.paid_ai_daily_limit = 50
            if user.paid_task_limit is None:
                user.paid_task_limit = 500
            if user.paid_goal_limit is None:
                user.paid_goal_limit = 100
            ensure_user_subscription_code(user)
            if deactivate_expired_subscription(user):
                changed = True
            changed = True
        if changed:
            db.session.commit()
    except Exception:
        logger.exception("Failed to ensure user plan fields")



def create_app():
    app = Flask(__name__)
    app.jinja_env.filters["clickable_sources"] = render_clickable_sources
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
        ensure_user_subscription_code(current_user)

        if request.method == "POST":
            form_action = request.form.get("form_action", "profile").strip()

            if form_action == "activate_paid":
                ok, message = activate_subscription_code_for_user(
                    current_user,
                    request.form.get("subscription_code", "")
                )
                flash(message, "success" if ok else "error")
                return redirect(url_for("profile"))

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
        today_value = str(date.today())
        ai_used_today = db.session.query(db.func.sum(AIUsage.count)).filter_by(user_id=current_user.id, usage_date=today_value).scalar() or 0
        db.session.commit()
        return render_template(
            "profile.html",
            total_goals=total_goals,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            task_limit=user_task_limit(current_user),
            goal_limit=user_goal_limit(current_user),
            ai_limit=user_ai_limit(current_user),
            ai_used_today=ai_used_today,
            paid_days_left=paid_days_left(current_user),
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




    @app.route("/user-guide")
    @login_required
    def user_guide():
        return render_template("user_guide.html")


    @app.route("/resources")
    @login_required
    def resources():
        # Keep resources available even after database resets or first deployment.
        seed_learning_resources()

        query = request.args.get("q", "").strip()
        category = request.args.get("category", "").strip()
        skill = request.args.get("skill", "").strip()
        exam = request.args.get("exam", "").strip()
        level = request.args.get("level", "").strip()
        resource_type = request.args.get("type", "").strip()
        official = request.args.get("official", "").strip()
        free = request.args.get("free", "").strip()

        resource_query = LearningResource.query

        if category:
            resource_query = resource_query.filter(LearningResource.category == category)
        if skill:
            resource_query = resource_query.filter(LearningResource.skill.ilike(f"%{skill}%"))
        if exam:
            resource_query = resource_query.filter(LearningResource.exam.ilike(f"%{exam}%"))
        if level:
            resource_query = resource_query.filter(LearningResource.level.ilike(f"%{level}%"))
        if resource_type:
            resource_query = resource_query.filter(LearningResource.resource_type == resource_type)
        if official == "1":
            resource_query = resource_query.filter(LearningResource.is_official.is_(True))
        if free == "1":
            resource_query = resource_query.filter(LearningResource.is_free.is_(True))
        if query:
            like = f"%{query}%"
            resource_query = resource_query.filter(db.or_(
                LearningResource.name.ilike(like),
                LearningResource.category.ilike(like),
                LearningResource.subcategory.ilike(like),
                LearningResource.skill.ilike(like),
                LearningResource.exam.ilike(like),
                LearningResource.description.ilike(like),
                LearningResource.tags_json.ilike(like),
            ))

        resources_list = resource_query.order_by(
            LearningResource.is_official.desc(),
            LearningResource.category.asc(),
            LearningResource.name.asc()
        ).all()

        db_categories = [row[0] for row in db.session.query(LearningResource.category).distinct().order_by(LearningResource.category.asc()).all() if row[0]]
        db_exams = [row[0] for row in db.session.query(LearningResource.exam).distinct().all() if row[0]]
        db_types = [row[0] for row in db.session.query(LearningResource.resource_type).distinct().all() if row[0]]

        categories = sorted(set(RESOURCE_CATEGORY_OPTIONS + db_categories))
        exams = sorted(set(RESOURCE_EXAM_OPTIONS + db_exams))
        types = sorted(set(RESOURCE_TYPE_OPTIONS + db_types))

        learning_path = build_resource_learning_path(category=category, exam=exam, skill=skill, level=level)
        saved_resource_ids = {
            item.resource_id
            for item in SavedResource.query.filter_by(user_id=current_user.id).all()
        }

        return render_template(
            "resources.html",
            resources=resources_list,
            categories=categories,
            exams=exams,
            types=types,
            learning_path=learning_path,
            saved_resource_ids=saved_resource_ids,
            selected={
                "q": query, "category": category, "skill": skill, "exam": exam,
                "level": level, "type": resource_type, "official": official, "free": free
            }
        )


    @app.route("/resources/<int:resource_id>/save", methods=["POST"])
    @login_required
    def save_resource(resource_id):
        seed_learning_resources()
        resource = LearningResource.query.get_or_404(resource_id)
        existing = SavedResource.query.filter_by(user_id=current_user.id, resource_id=resource.id).first()
        if existing:
            flash("This resource is already in My Resources.", "success")
            return redirect(request.referrer or url_for("resources"))

        saved = SavedResource(
            user_id=current_user.id,
            resource_id=resource.id,
            status="Not Started",
            notes="",
        )
        db.session.add(saved)
        db.session.commit()
        flash("Resource saved to My Resources.", "success")
        return redirect(request.referrer or url_for("resources"))

    @app.route("/resources/<int:resource_id>/unsave", methods=["POST"])
    @login_required
    def unsave_resource(resource_id):
        saved = SavedResource.query.filter_by(user_id=current_user.id, resource_id=resource_id).first_or_404()
        db.session.delete(saved)
        db.session.commit()
        flash("Resource removed from My Resources.", "success")
        return redirect(request.referrer or url_for("resources"))

    @app.route("/my-resources")
    @login_required
    def my_resources():
        seed_learning_resources()
        category = request.args.get("category", "").strip()
        status = request.args.get("status", "").strip()

        saved_query = SavedResource.query.join(LearningResource).filter(SavedResource.user_id == current_user.id)

        if category:
            saved_query = saved_query.filter(LearningResource.category == category)
        if status:
            saved_query = saved_query.filter(SavedResource.status == status)

        saved_items = saved_query.order_by(SavedResource.id.desc()).all()
        categories = sorted({item.resource.category for item in saved_items if item.resource and item.resource.category})
        statuses = ["Not Started", "In Progress", "Completed"]

        return render_template(
            "my_resources.html",
            saved_items=saved_items,
            categories=categories,
            statuses=statuses,
            selected={"category": category, "status": status}
        )

    @app.route("/my-resources/<int:saved_id>/update", methods=["POST"])
    @login_required
    def update_saved_resource(saved_id):
        item = SavedResource.query.filter_by(id=saved_id, user_id=current_user.id).first_or_404()
        item.status = request.form.get("status", item.status).strip() or "Not Started"
        item.notes = request.form.get("notes", "").strip()
        db.session.commit()
        flash("Resource notes updated.", "success")
        return redirect(url_for("my_resources"))

    @app.route("/my-resources/<int:saved_id>/delete", methods=["POST"])
    @login_required
    def delete_saved_resource(saved_id):
        item = SavedResource.query.filter_by(id=saved_id, user_id=current_user.id).first_or_404()
        db.session.delete(item)
        db.session.commit()
        flash("Saved resource deleted.", "success")
        return redirect(url_for("my_resources"))

    @app.route("/my-resources/<int:saved_id>/open")
    @login_required
    def open_saved_resource(saved_id):
        item = SavedResource.query.filter_by(id=saved_id, user_id=current_user.id).first_or_404()
        item.last_opened = datetime.utcnow()
        db.session.commit()
        return redirect(item.resource.url)


    @app.route("/api/resources/suggest")
    @login_required
    def suggest_resources():
        seed_learning_resources()
        text = request.args.get("text", "").strip()
        limit = int(request.args.get("limit", 5) or 5)
        all_resources = LearningResource.query.all()
        ranked = []
        for resource in all_resources:
            score = resource_match_score(resource, text)
            if score > 0:
                ranked.append((score, resource))
        ranked.sort(key=lambda item: item[0], reverse=True)
        return jsonify([
            {
                "name": r.name,
                "category": r.category,
                "subcategory": r.subcategory,
                "skill": r.skill,
                "exam": r.exam,
                "level": r.level,
                "type": r.resource_type,
                "url": r.url,
                "description": r.description,
                "official": r.is_official,
                "free": r.is_free,
                "score": score,
            }
            for score, r in ranked[:limit]
        ])


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
            ensure_user_subscription_code(user)
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
                "paid_active": bool(getattr(user, "paid_active", False)),
                "task_limit": user_task_limit(user),
                "goal_limit": user_goal_limit(user),
                "ai_limit": user_ai_limit(user),
                "paid_days_left": paid_days_left(user),
            })

        available_codes = SubscriptionCode.query.filter_by(is_used=False, is_cancelled=False).count()
        used_codes = SubscriptionCode.query.filter_by(is_used=True).count()
        cancelled_codes = SubscriptionCode.query.filter_by(is_cancelled=True).count()
        expired_subscriptions = SubscriptionCode.query.filter(
            SubscriptionCode.is_used.is_(True),
            SubscriptionCode.expires_at.isnot(None),
            SubscriptionCode.expires_at < datetime.utcnow(),
        ).count()
        recent_codes = SubscriptionCode.query.order_by(SubscriptionCode.id.desc()).limit(30).all()

        db.session.commit()

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
            available_codes=available_codes,
            used_codes=used_codes,
            cancelled_codes=cancelled_codes,
            expired_subscriptions=expired_subscriptions,
            recent_codes=recent_codes,
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






    @app.route("/admin/subscription-codes/generate", methods=["POST"])
    @login_required
    @admin_required
    def admin_generate_global_subscription_codes():
        quantity = int(request.form.get("quantity", 10) or 10)
        duration_days = int(request.form.get("duration_days", 30) or 30)
        note = request.form.get("note", "").strip()

        quantity = max(1, min(quantity, 200))
        duration_days = max(1, min(duration_days, 3650))

        for _ in range(quantity):
            db.session.add(SubscriptionCode(
                code=generate_unique_subscription_code(),
                duration_days=duration_days,
                is_used=False,
                is_cancelled=False,
                created_by_admin_id=current_user.id,
                note=note[:255],
            ))

        db.session.commit()
        flash(f"{quantity} subscription codes generated.", "success")
        return redirect(url_for("admin_dashboard"))

    @app.route("/admin/subscription-codes/<int:code_id>/cancel", methods=["POST"])
    @login_required
    @admin_required
    def admin_cancel_subscription_code(code_id):
        code = SubscriptionCode.query.get_or_404(code_id)
        if code.is_used:
            flash("Used codes cannot be cancelled.", "error")
        else:
            code.is_cancelled = True
            db.session.commit()
            flash("Subscription code cancelled.", "success")
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
        user.task_limit = int(request.form.get("task_limit", 20) or 20)
        user.goal_limit = int(request.form.get("goal_limit", 5) or 5)
        user.paid_ai_daily_limit = int(request.form.get("paid_ai_daily_limit", 50) or 50)
        user.paid_task_limit = int(request.form.get("paid_task_limit", 500) or 500)
        user.paid_goal_limit = int(request.form.get("paid_goal_limit", 100) or 100)
        previous_paid_active = bool(user.paid_active)
        user.paid_active = request.form.get("paid_active") == "on"
        if user.paid_active and not previous_paid_active and not user.subscription_expires_at:
            user.paid_activated_at = datetime.utcnow()
            user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
        if not user.paid_active:
            user.subscription_expires_at = None
        ensure_user_subscription_codes(user, minimum=3)
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




    @app.route("/goals", methods=["GET", "POST"])
    @login_required
    def goals():
        if request.method == "POST":
            current_goal_count = Goal.query.filter_by(user_id=current_user.id).count()
            allowed_goals = user_goal_limit(current_user)
            if allowed_goals is not None and current_goal_count >= allowed_goals:
                flash(limit_upgrade_message("goals"), "error")
                return redirect(url_for("goals"))

            current_state = request.form.get("current_state", "").strip() or request.form.get("current_level", "").strip() or "Not started"
            if current_state in ["Custom", "تحديد يدوي"]:
                current_state = request.form.get("custom_current_state", "").strip() or current_state
            goal = Goal(
                user_id=current_user.id,
                title=request.form.get("title", "").strip(),
                category=request.form.get("category", "General").strip(),
                current_level=current_state,
                daily_minutes=0,
                start_date=request.form.get("start_date", "").strip(),
                deadline=request.form.get("deadline", "").strip(),
                reminder_time="",
                notes=build_goal_notes_from_form(request.form),
            )

            if not goal.title:
                flash("Goal title is required.", "error")
                return redirect(url_for("goals"))

            db.session.add(goal)
            db.session.commit()
            flash("Smart goal saved. Create your own tasks, and EduPath AI will connect related completed tasks automatically.", "success")
            return redirect(url_for("goals"))

        all_goals = Goal.query.filter_by(user_id=current_user.id).order_by(Goal.id.desc()).all()
        for goal in all_goals:
            goal.time_left = calculate_goal_time_left(goal.deadline)
            goal.goal_progress = calculate_goal_progress(goal)
            goal.goal_confidence = goal_confidence(goal)
            goal.milestones = extract_goal_milestones(goal)
            goal.plan = parse_goal_plan(goal)
        return render_template("goals.html", goals=all_goals)

    @app.route("/goal/<int:goal_id>/edit", methods=["GET", "POST"])
    @login_required
    def edit_goal(goal_id):
        goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first_or_404()

        if request.method == "POST":
            goal.title = request.form.get("title", "").strip()
            goal.category = request.form.get("category", goal.category or "General").strip()
            current_level = request.form.get("current_level", "").strip()
            if current_level:
                goal.current_level = current_level
            goal.start_date = request.form.get("start_date", "").strip()
            goal.deadline = request.form.get("deadline", "").strip()
            # Keep reminder empty for goals; reminders belong to tasks.
            goal.reminder_time = ""
            goal.notes = request.form.get("notes", "").strip()
            db.session.commit()
            flash("Goal changes saved.", "success")
            return redirect(url_for("goals"))

        return render_template("edit_goal.html", goal=goal)

    @app.route("/goal/<int:goal_id>/delete")
    @login_required
    def delete_goal(goal_id):
        goal = Goal.query.filter_by(id=goal_id, user_id=current_user.id).first_or_404()

        # Delete smart links first so PostgreSQL does not try to set goal_id to NULL.
        GoalTaskLink.query.filter_by(goal_id=goal.id, user_id=current_user.id).delete(synchronize_session=False)

        # Do not delete user-created tasks. A task can exist independently from the goal.
        for task in list(goal.tasks):
            task.goal_id = None

        db.session.delete(goal)
        db.session.commit()
        flash("Goal deleted. Your tasks were kept safely.", "success")
        return redirect(url_for("goals"))

    @app.route("/tasks", methods=["GET", "POST"])
    @login_required
    def tasks():
        if request.method == "POST":
            current_task_count = StudyTask.query.filter_by(user_id=current_user.id).count()
            allowed_tasks = user_task_limit(current_user)
            if allowed_tasks is not None and current_task_count >= allowed_tasks:
                flash(limit_upgrade_message("tasks"), "error")
                return redirect(url_for("tasks"))

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
                reminder_time="",
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

        linked_goals = link_completed_task_to_goals(task)

        if os.environ.get("SEND_TASK_COMPLETION_EMAILS", "false").lower() == "true" and task.completion_email_sent_at != str(date.today()):
            if send_task_completion_email(current_user, task):
                task.completion_email_sent_at = str(date.today())
                db.session.commit()

        related_msg = ""
        if linked_goals:
            related_msg = " Related goal: " + linked_goals[0][0].title
        session["toast_notifications"] = [{
            "title": "Great work!",
            "body": f"You completed: {task.title}.{related_msg} Keep your momentum going."
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
        submitted_text = ""
        submitted_topic = ""
        selected_mode = "natural"

        if request.method == "POST":
            coach_type = request.form.get("coach_type", "quick").strip()
            active_tab = coach_type

            status = ai_usage_status(current_user, "english")
            if not status["allowed"]:
                flash(limit_upgrade_message("AI Coach daily usage"), "error")
                return redirect(url_for("english"))

            if coach_type == "essay":
                topic = request.form.get("essay_topic", "").strip()
                essay = request.form.get("essay_text", "").strip()
                submitted_topic = topic
                submitted_text = essay

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
                submitted_text = text
                selected_mode = mode

                if not text:
                    flash("Please write text first.", "error")
                    return redirect(url_for("english"))

                mode_descriptions = {
                    "natural": "Natural, fluent, everyday English that still sounds polished.",
                    "simple": "Simple and clear English with easy vocabulary and short sentences.",
                    "formal": "Formal scholarship or academic style.",
                    "interview": "Confident spoken interview answer with simple vocabulary.",
                    "academic": "Academic style with stronger structure and precise wording.",
                    "friendly": "Friendly and warm tone.",
                    "concise": "Shorter, direct, and focused version.",
                    "grammar": "Focus mainly on grammar correction and explanation.",
                    "vocabulary": "Improve vocabulary and expressions without making it too complex.",
                    "email": "Professional email style.",
                    "ielts": "IELTS-style answer with clear organization and appropriate vocabulary.",
                    "toefl": "TOEFL-style answer with direct academic clarity."
                }
                mode_instruction = mode_descriptions.get(mode, mode_descriptions["natural"])

                prompt = f"""
You are an English coach for a scholarship student.

Mode: {mode}
Mode instruction: {mode_instruction}

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

        return render_template(
            "english.html",
            result=result,
            essay_result=essay_result,
            active_tab=active_tab,
            submitted_text=submitted_text,
            submitted_topic=submitted_topic,
            selected_mode=selected_mode
        )

    @app.route("/english/save", methods=["POST"])
    @login_required
    def save_english_answer():
        coach_type = request.form.get("coach_type", "quick").strip()
        mode = request.form.get("mode", "").strip()
        topic = request.form.get("topic", "").strip()
        original_text = request.form.get("original_text", "").strip()
        result_json = request.form.get("result_json", "").strip()

        if not result_json:
            flash("Nothing to save.", "error")
            return redirect(url_for("english"))

        saved = EnglishCoachSavedAnswer(
            user_id=current_user.id,
            coach_type=coach_type,
            mode=mode,
            topic=topic,
            original_text=original_text,
            result_json=result_json,
        )
        db.session.add(saved)
        db.session.commit()
        flash("English Coach answer saved.", "success")
        return redirect(url_for("saved_english_answers"))

    @app.route("/english/saved")
    @login_required
    def saved_english_answers():
        saved_answers = EnglishCoachSavedAnswer.query.filter_by(user_id=current_user.id).order_by(EnglishCoachSavedAnswer.id.desc()).all()
        parsed_answers = []
        for item in saved_answers:
            try:
                parsed = json.loads(item.result_json)
            except Exception:
                parsed = {}
            item.parsed_result = parsed
            parsed_answers.append(item)
        return render_template("english_saved.html", saved_answers=parsed_answers)

    @app.route("/english/saved/<int:item_id>/delete")
    @login_required
    def delete_saved_english_answer(item_id):
        item = EnglishCoachSavedAnswer.query.filter_by(id=item_id, user_id=current_user.id).first_or_404()
        db.session.delete(item)
        db.session.commit()
        flash("Saved English Coach answer deleted.", "success")
        return redirect(url_for("saved_english_answers"))

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




def build_goal_notes_from_form(form):
    goal_category = form.get("goal_category", "").strip()
    goal_path = form.get("goal_path", "").strip()
    current_state = form.get("current_state", "").strip()
    target_state = form.get("target_state", "").strip()
    commitment = form.get("commitment", "").strip()

    if goal_category in ["Other", "أخرى", "Custom", "خطة مخصصة"]:
        goal_category = form.get("custom_goal_category", "").strip() or goal_category
    if goal_path in ["Other", "أخرى", "Custom Plan", "خطة مخصصة"]:
        goal_path = form.get("custom_goal_path", "").strip() or goal_path
    if current_state in ["Custom", "تحديد يدوي"]:
        current_state = form.get("custom_current_state", "").strip() or current_state
    if target_state in ["Custom", "خطة مخصصة", "تحديد يدوي"]:
        target_state = form.get("custom_target_state", "").strip() or target_state
    if commitment in ["Custom", "خطة مخصصة"]:
        commitment = form.get("custom_commitment", "").strip() or commitment

    generated_keywords = generate_goal_keywords_from_form(form, goal_category, goal_path, current_state, target_state, commitment)

    fields = {
        "Goal Type": form.get("category", "").strip(),
        "Goal Category": goal_category,
        "Goal Path": goal_path,
        "Current State": current_state,
        "Target State": target_state,
        "Goal Outcome": form.get("goal_outcome", "").strip(),
        "Milestones": form.get("milestones", "").strip(),
        "Commitment": commitment,
        "Keywords": ", ".join(generated_keywords),
        "User Notes": form.get("notes", "").strip(),
    }
    lines = ["SMART_GOAL_INTELLIGENCE"]
    for key, value in fields.items():
        if value:
            lines.append(f"{key}: {value}")
    return "\n".join(lines)


def generate_goal_keywords_from_form(form, goal_category="", goal_path="", current_state="", target_state="", commitment=""):
    raw = [
        form.get("category", ""),
        goal_category,
        goal_path,
        current_state,
        target_state,
        commitment,
        form.get("goal_outcome", ""),
        form.get("milestones", ""),
    ]
    text = " ".join(raw)
    keywords = tokenize_mixed_text(text)

    lower = text.lower()
    if "ielts" in lower:
        keywords.update(["IELTS","English","Reading","Writing","Listening","Speaking","Vocabulary","Grammar","Mock Test","Task 1","Task 2"])
    if "toefl" in lower:
        keywords.update(["TOEFL","Reading","Listening","Writing","Speaking","Academic Discussion","Email"])
    if "duolingo" in lower:
        keywords.update(["Duolingo","Interactive Reading","Interactive Listening","Interactive Writing","Interactive Speaking"])
    if "csca" in lower:
        keywords.update(["CSCA","Mathematics","Physics","Chemistry"])
    if "python" in lower or "flask" in lower:
        keywords.update(["Python","Flask","Backend","Web App","Routes","Templates","Database","Login","API","Deployment"])
    if "scholarship" in lower or "منحة" in text:
        keywords.update(["Scholarship","منحة","Documents","CV","Motivation Letter","Interview","Application","University"])
    if "قرآن" in text or "القرآن" in text or "جزء عم" in text or "حفظ" in text:
        keywords.update(["قرآن","حفظ","مراجعة","تسميع","تجويد","جزء عم","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"])
    return sorted({k.strip() for k in keywords if k and len(k.strip()) >= 2})



def calculate_goal_time_left(deadline):
    if not deadline:
        return None
    try:
        target = datetime.strptime(deadline, "%Y-%m-%d").date()
        days = (target - date.today()).days
        return {"days": days, "weeks": round(days / 7, 1), "months": round(days / 30.44, 1), "status": "remaining" if days >= 0 else "overdue"}
    except Exception:
        return None



def parse_goal_plan(goal):
    data = {}
    text = goal.notes or ""
    for line in text.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip()
    return data


def tokenize_mixed_text(text):
    text = (text or "").lower()
    arabic_words = re.findall(r"[\u0600-\u06FF]{2,}", text)
    latin_words = re.findall(r"[a-zA-Z0-9+#.]{2,}", text)
    return set(arabic_words + latin_words)


def task_match_text(task):
    return " ".join([
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
    ])


def goal_keywords(goal):
    plan = parse_goal_plan(goal)
    base = " ".join([
        goal.title or "",
        goal.category or "",
        goal.current_level or "",
        goal.notes or "",
        plan.get("Goal Type", ""),
        plan.get("Goal Category", ""),
        plan.get("Goal Path", ""),
        plan.get("Current State", ""),
        plan.get("Target State", ""),
        plan.get("Goal Outcome", ""),
        plan.get("Milestones", ""),
        plan.get("Keywords", ""),
    ])

    keywords = tokenize_mixed_text(base)
    lower_base = base.lower()

    if "ielts" in lower_base:
        keywords.update(["ielts","english","reading","writing","listening","speaking","vocabulary","grammar","mock","task","academic"])
    if "toefl" in lower_base:
        keywords.update(["toefl","reading","listening","writing","speaking","academic","email","discussion"])
    if "duolingo" in lower_base:
        keywords.update(["duolingo","reading","listening","writing","speaking","interactive"])
    if "csca" in lower_base:
        keywords.update(["csca","mathematics","physics","chemistry","math","mechanics","algebra"])
    if "python" in lower_base or "flask" in lower_base:
        keywords.update(["python","flask","backend","web","routes","templates","database","login","api","deployment","oop"])
    if "scholarship" in lower_base or "منحة" in lower_base:
        keywords.update(["scholarship","منحة","cv","motivation","statement","interview","documents","application","university","visa"])
    if "قرآن" in base or "القرآن" in base or "جزء عم" in base or "حفظ" in base:
        keywords.update([
            "قرآن","القرآن","حفظ","مراجعة","تسميع","تجويد","سورة","جزء","عم","جزء عم",
            "النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج",
            "الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح",
            "التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر",
            "العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
            "المسد","الإخلاص","الفلق","الناس"
        ])
    return {k for k in keywords if len(k.strip()) >= 2}


def calculate_match_score(goal, task):
    plan = parse_goal_plan(goal)
    task_text = task_match_text(task).lower()
    goal_text = " ".join([
        goal.title or "",
        goal.category or "",
        goal.current_level or "",
        goal.notes or "",
        plan.get("Goal Category", ""),
        plan.get("Goal Path", ""),
        plan.get("Goal Outcome", ""),
    ]).lower()

    score = 0
    matched = []

    for keyword in goal_keywords(goal):
        key = keyword.lower().strip()
        if key and key in task_text:
            score += 8
            matched.append(keyword)

    for field in [goal.category, plan.get("Goal Category"), plan.get("Goal Path")]:
        field = (field or "").lower().strip()
        if field and field in task_text:
            score += 22
            matched.append(field)

    if ("قرآن" in goal_text or "جزء عم" in goal_text or "حفظ" in goal_text) and any(x in task_text for x in ["قرآن","حفظ","مراجعة","تسميع","سورة"]):
        score += 25
        matched.append("Quran context")

    score = min(score, 100)
    reason = "Matched: " + ", ".join(sorted(set(str(x) for x in matched))[:12]) if matched else "No strong match"
    return score, reason


def calculate_progress_added(task, match_score):
    minutes = task.estimated_minutes or 30
    time_weight = min(1.5, max(0.15, minutes / 60))
    if match_score >= 80:
        multiplier = 1.0
    elif match_score >= 60:
        multiplier = 0.6
    elif match_score >= 40:
        multiplier = 0.3
    else:
        multiplier = 0
    return round(time_weight * multiplier, 2)


def link_completed_task_to_goals(task):
    if task.status != "done":
        return []
    linked = []
    goals = Goal.query.filter_by(user_id=task.user_id).all()
    for goal in goals:
        score, reason = calculate_match_score(goal, task)
        if score < 40:
            continue
        progress_added = calculate_progress_added(task, score)
        existing = GoalTaskLink.query.filter_by(goal_id=goal.id, task_id=task.id).first()
        if existing:
            existing.match_score = max(existing.match_score, score)
            existing.match_reason = reason
            existing.progress_added = max(existing.progress_added, progress_added)
        else:
            db.session.add(GoalTaskLink(
                goal_id=goal.id,
                task_id=task.id,
                user_id=task.user_id,
                match_score=score,
                match_reason=reason,
                progress_added=progress_added,
                is_confirmed_by_user=False,
            ))
        linked.append((goal, score, reason))
    db.session.commit()
    return linked


def extract_goal_milestones(goal):
    plan = parse_goal_plan(goal)
    milestones = plan.get("Milestones", "")
    if milestones:
        return [m.strip() for m in re.split(r",|→|\n", milestones) if m.strip()]
    text = (goal.notes or "") + " " + (goal.title or "")
    if "جزء عم" in text:
        return ["النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"]
    if "ielts" in text.lower():
        return ["Band 5.5","Band 6.0","Band 6.5","Band 7.0"]
    if "python" in text.lower() or "flask" in text.lower():
        return ["Syntax","Functions","OOP","Flask Basics","Database","Final Project","Deployment"]
    if "scholarship" in text.lower() or "منحة" in text:
        return ["University Selection","Documents","Motivation Letter","Application Review","Submission","Follow-up"]
    return []


def calculate_goal_progress(goal):
    """Progress is based only on related user-created completed tasks."""
    try:
        links = GoalTaskLink.query.filter_by(goal_id=goal.id).all()

        if not links:
            for task in StudyTask.query.filter_by(user_id=goal.user_id, status="done").all():
                score, reason = calculate_match_score(goal, task)
                if score >= 40:
                    db.session.add(GoalTaskLink(
                        goal_id=goal.id,
                        task_id=task.id,
                        user_id=goal.user_id,
                        match_score=score,
                        match_reason=reason,
                        progress_added=calculate_progress_added(task, score),
                        is_confirmed_by_user=False,
                    ))
            db.session.commit()
            links = GoalTaskLink.query.filter_by(goal_id=goal.id).all()

        if not links:
            return 0

        progress_points = sum(link.progress_added for link in links if link.task and link.task.status == "done")
        return min(100, int(progress_points * 10))
    except Exception:
        logger.exception("Smart goal progress calculation failed")
        return 0


def goal_confidence(goal):
    try:
        links = GoalTaskLink.query.filter_by(goal_id=goal.id).order_by(GoalTaskLink.id.desc()).all()
        completed = [l for l in links if l.task and l.task.status == "done"]
        hours = sum((l.task.estimated_minutes or 0) for l in completed) / 60
        milestones = extract_goal_milestones(goal)
        task_text = " ".join(task_match_text(l.task).lower() for l in completed if l.task)
        touched = sum(1 for milestone in milestones if milestone.lower() in task_text)
        return {
            "related_tasks": len(completed),
            "study_hours": round(hours, 1),
            "milestones_touched": touched,
            "last_task": completed[0].task.title if completed else None,
        }
    except Exception:
        return {"related_tasks": 0, "study_hours": 0, "milestones_touched": 0, "last_task": None}



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
                    """CREATE TABLE IF NOT EXISTS goal_task_link (
                        id SERIAL PRIMARY KEY,
                        goal_id INTEGER NOT NULL,
                        task_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        match_score INTEGER NOT NULL DEFAULT 0,
                        match_reason TEXT,
                        progress_added DOUBLE PRECISION NOT NULL DEFAULT 0,
                        is_confirmed_by_user BOOLEAN NOT NULL DEFAULT FALSE,
                        linked_at TIMESTAMP
                    )""",

                    """CREATE TABLE IF NOT EXISTS english_coach_saved_answer (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        coach_type VARCHAR(30) NOT NULL DEFAULT 'quick',
                        mode VARCHAR(80),
                        topic TEXT,
                        original_text TEXT,
                        result_json TEXT NOT NULL,
                        created_at TIMESTAMP
                    )""",

                    """CREATE TABLE IF NOT EXISTS learning_resource (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(180) NOT NULL,
                        category VARCHAR(80) NOT NULL,
                        subcategory VARCHAR(120),
                        skill VARCHAR(120),
                        exam VARCHAR(80),
                        level VARCHAR(80),
                        resource_type VARCHAR(80),
                        url TEXT NOT NULL,
                        description TEXT,
                        tags_json TEXT,
                        is_official BOOLEAN NOT NULL DEFAULT FALSE,
                        is_free BOOLEAN NOT NULL DEFAULT TRUE,
                        language VARCHAR(40),
                        created_at TIMESTAMP
                    )""",

                    """CREATE TABLE IF NOT EXISTS saved_resource (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        resource_id INTEGER NOT NULL,
                        status VARCHAR(40) NOT NULL DEFAULT 'Not Started',
                        notes TEXT,
                        last_opened TIMESTAMP,
                        created_at TIMESTAMP
                    )""",

                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS task_limit INTEGER DEFAULT 20""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS goal_limit INTEGER DEFAULT 5""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS paid_ai_daily_limit INTEGER DEFAULT 50""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS paid_task_limit INTEGER DEFAULT 500""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS paid_goal_limit INTEGER DEFAULT 100""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_code VARCHAR(32)""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS paid_active BOOLEAN DEFAULT FALSE""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS paid_activated_at TIMESTAMP""",
                    """CREATE TABLE IF NOT EXISTS subscription_code (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        code VARCHAR(32) NOT NULL UNIQUE,
                        duration_days INTEGER NOT NULL DEFAULT 30,
                        is_used BOOLEAN NOT NULL DEFAULT FALSE,
                        used_at TIMESTAMP,
                        created_at TIMESTAMP
                    )""",
                    """ALTER TABLE "user" ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP""",

                    """ALTER TABLE subscription_code ADD COLUMN IF NOT EXISTS used_by_user_id INTEGER""",
                    """ALTER TABLE subscription_code ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP""",
                    """ALTER TABLE subscription_code ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE""",
                    """ALTER TABLE subscription_code ADD COLUMN IF NOT EXISTS created_by_admin_id INTEGER""",
                    """ALTER TABLE subscription_code ADD COLUMN IF NOT EXISTS note VARCHAR(255)""",
                    """CREATE TABLE IF NOT EXISTS subscription_activation_attempt (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        attempted_code VARCHAR(80),
                        was_successful BOOLEAN NOT NULL DEFAULT FALSE,
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
            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS goal_task_link (
                    id INTEGER PRIMARY KEY,
                    goal_id INTEGER NOT NULL,
                    task_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    match_score INTEGER NOT NULL DEFAULT 0,
                    match_reason TEXT,
                    progress_added REAL NOT NULL DEFAULT 0,
                    is_confirmed_by_user BOOLEAN NOT NULL DEFAULT 0,
                    linked_at DATETIME
                )
            """)

            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS english_coach_saved_answer (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    coach_type VARCHAR(30) NOT NULL DEFAULT 'quick',
                    mode VARCHAR(80),
                    topic TEXT,
                    original_text TEXT,
                    result_json TEXT NOT NULL,
                    created_at DATETIME
                )
            """)

            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS learning_resource (
                    id INTEGER PRIMARY KEY,
                    name VARCHAR(180) NOT NULL,
                    category VARCHAR(80) NOT NULL,
                    subcategory VARCHAR(120),
                    skill VARCHAR(120),
                    exam VARCHAR(80),
                    level VARCHAR(80),
                    resource_type VARCHAR(80),
                    url TEXT NOT NULL,
                    description TEXT,
                    tags_json TEXT,
                    is_official BOOLEAN NOT NULL DEFAULT 0,
                    is_free BOOLEAN NOT NULL DEFAULT 1,
                    language VARCHAR(40),
                    created_at DATETIME
                )
            """)

            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS saved_resource (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    resource_id INTEGER NOT NULL,
                    status VARCHAR(40) NOT NULL DEFAULT 'Not Started',
                    notes TEXT,
                    last_opened DATETIME,
                    created_at DATETIME
                )
            """)


            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS subscription_code (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    code VARCHAR(32) NOT NULL UNIQUE,
                    duration_days INTEGER NOT NULL DEFAULT 30,
                    is_used BOOLEAN NOT NULL DEFAULT 0,
                    used_at DATETIME,
                    created_at DATETIME
                )
            """)
            existing_user_cols = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(user)").fetchall()}
            if "subscription_expires_at" not in existing_user_cols:
                connection.exec_driver_sql("ALTER TABLE user ADD COLUMN subscription_expires_at DATETIME")

            # v480_global_subscription_code_pool
            connection.exec_driver_sql("""
                CREATE TABLE IF NOT EXISTS subscription_activation_attempt (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    attempted_code VARCHAR(80),
                    was_successful BOOLEAN NOT NULL DEFAULT 0,
                    created_at DATETIME
                )
            """)
            existing_code_cols = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(subscription_code)").fetchall()}
            code_columns_to_add = {
                "used_by_user_id": "INTEGER",
                "expires_at": "DATETIME",
                "is_cancelled": "BOOLEAN DEFAULT 0",
                "created_by_admin_id": "INTEGER",
                "note": "VARCHAR(255)",
            }
            for column_name, column_type in code_columns_to_add.items():
                if column_name not in existing_code_cols:
                    connection.exec_driver_sql(f"ALTER TABLE subscription_code ADD COLUMN {column_name} {column_type}")

            # v478_user_limits_columns
            existing_user_cols = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(user)").fetchall()}
            user_columns_to_add = {
                "task_limit": "INTEGER DEFAULT 20",
                "goal_limit": "INTEGER DEFAULT 5",
                "paid_ai_daily_limit": "INTEGER DEFAULT 50",
                "paid_task_limit": "INTEGER DEFAULT 500",
                "paid_goal_limit": "INTEGER DEFAULT 100",
                "subscription_code": "VARCHAR(32)",
                "paid_active": "BOOLEAN DEFAULT 0",
                "paid_activated_at": "DATETIME",
            }
            for column_name, column_type in user_columns_to_add.items():
                if column_name not in existing_user_cols:
                    connection.exec_driver_sql(f"ALTER TABLE user ADD COLUMN {column_name} {column_type}")

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

