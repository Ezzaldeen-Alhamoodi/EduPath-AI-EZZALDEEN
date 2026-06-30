"""
AlwaysData WSGI entrypoint for EduPath AI EZZALDEEN.

In AlwaysData Web app settings, point the WSGI file/application path to this file.
It keeps Render compatibility because server.py, wsgi.py, run.py, and Procfile are unchanged.
"""
from app import create_app

app = create_app()
application = app
