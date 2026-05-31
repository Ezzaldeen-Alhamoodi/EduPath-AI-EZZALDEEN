\
import os
import json
import logging
import unicodedata
from datetime import datetime, date, timedelta

from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    goals = db.relationship("Goal", backref="owner", lazy=True)
    tasks = db.relationship("StudyTask", backref="owner", lazy=True)
    interview_answers = db.relationship("InterviewAnswer", backref="owner", lazy=True)
    mistakes = db.relationship("MistakeLog", backref="owner", lazy=True)

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
    """Send email if SMTP is configured. Otherwise log the email body for development."""
    try:
        if not current_app_mail_is_configured():
            logger.info("Email not configured. Subject: %s | Recipients: %s | Body: %s", subject, recipients, body)
            return False
        message = Message(subject=subject, recipients=recipients, body=body)
        mail.send(message)
        return True
    except Exception:
        logger.exception("Email sending failed")
        return False

def current_app_mail_is_configured():
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


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL",
        "sqlite:///edupath_ai_ezzaldeen.db",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "")
    app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", "587"))
    app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    app.config["MAIL_USE_SSL"] = os.environ.get("MAIL_USE_SSL", "false").lower() == "true"
    app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "")
    app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "")
    app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER", app.config["MAIL_USERNAME"] or "noreply@edupath.ai")
    app.config["REQUIRE_EMAIL_VERIFICATION"] = os.environ.get("REQUIRE_EMAIL_VERIFICATION", "true").lower() == "true"


    db.init_app(app)
    login_manager.init_app(app)
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
            )
            db.session.add(user)
            db.session.commit()
            login_user(user)
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
                flash("Invalid email or password.", "error")
                return redirect(url_for("login"))

            if app.config.get("REQUIRE_EMAIL_VERIFICATION", True) and not user.email_verified:
                flash("Your email is not verified yet. Please verify it before logging in.", "error")
                return redirect(url_for("resend_verification_public"))

            login_user(user)
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
            if user:
                send_password_reset_email(user)
            flash("If this email exists, a password reset link has been sent.", "success")
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




    @app.route("/coach")
    @login_required
    def coach():
        recent_answers = InterviewAnswer.query.filter_by(user_id=current_user.id).order_by(InterviewAnswer.id.desc()).limit(5).all()
        return render_template("coach.html", recent_answers=recent_answers)

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
        )

    @app.route("/goals", methods=["GET", "POST"])
    @login_required
    def goals():
        if request.method == "POST":
            goal = Goal(
                user_id=current_user.id,
                title=request.form.get("title", "").strip(),
                category=request.form.get("category", "General").strip(),
                current_level=request.form.get("current_level", "Beginner").strip(),
                daily_minutes=int(request.form.get("daily_minutes", 60) or 60),
                start_date=request.form.get("start_date", "").strip(),
                deadline=request.form.get("deadline", "").strip(),
                reminder_time=request.form.get("reminder_time", "").strip(),
                notes=request.form.get("notes", "").strip(),
            )

            if not goal.title:
                flash("Goal title is required.", "error")
                return redirect(url_for("goals"))

            db.session.add(goal)
            db.session.commit()
            flash("Goal saved. Add related tasks manually from the Tasks page.", "success")
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
                language=request.form.get("language", "").strip(),
                practice_type=request.form.get("practice_type", "").strip(),
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
            task.language = request.form.get("language", "").strip()
            task.practice_type = request.form.get("practice_type", "").strip()
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
                ai_text = call_ai(ai_client, prompt, max_tokens=800, temperature=0.3)
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

        if request.method == "POST":
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
            result = parse_json_object(ai_text)

        return render_template("english.html", result=result)

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
    try:
        tasks = list(goal.tasks)
        if not tasks:
            return 0
        done = sum(1 for task in tasks if task.status == "done")
        return int((done / len(tasks)) * 100)
    except Exception:
        return 0


def ensure_database_columns():
    """SQLite-safe migration for v3.0 Phase 1 authentication and user-owned data."""
    try:
        with db.engine.connect() as connection:
            table_columns = {}
            for table in ["goal", "study_task", "interview_answer", "mistake_log", "user"]:
                try:
                    table_columns[table] = [row[1] for row in connection.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()]
                except Exception:
                    table_columns[table] = []

            additions = {
                "user": {
                    "email_verified": "ALTER TABLE user ADD COLUMN email_verified BOOLEAN DEFAULT 0",
                    "verification_sent_at": "ALTER TABLE user ADD COLUMN verification_sent_at DATETIME"
                },
                "goal": {
                    "user_id": "ALTER TABLE goal ADD COLUMN user_id INTEGER"
                },
                "study_task": {
                    "user_id": "ALTER TABLE study_task ADD COLUMN user_id INTEGER",
                    "repeat_days": "ALTER TABLE study_task ADD COLUMN repeat_days VARCHAR(120)",
                    "topic": "ALTER TABLE study_task ADD COLUMN topic VARCHAR(120)",
                    "custom_category": "ALTER TABLE study_task ADD COLUMN custom_category VARCHAR(120)",
                    "custom_topic": "ALTER TABLE study_task ADD COLUMN custom_topic VARCHAR(120)",
                    "custom_skill": "ALTER TABLE study_task ADD COLUMN custom_skill VARCHAR(120)"
                },
                "interview_answer": {
                    "user_id": "ALTER TABLE interview_answer ADD COLUMN user_id INTEGER"
                },
                "mistake_log": {
                    "user_id": "ALTER TABLE mistake_log ADD COLUMN user_id INTEGER"
                }
            }

            for table, cols in additions.items():
                existing = table_columns.get(table, [])
                for column, sql in cols.items():
                    if column not in existing:
                        connection.exec_driver_sql(sql)

            connection.commit()
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
