"""
EduPath AI production WSGI entrypoint for Render.

Recommended Start Command:
    gunicorn server:app
"""
from app import create_app

app = create_app()
application = app
