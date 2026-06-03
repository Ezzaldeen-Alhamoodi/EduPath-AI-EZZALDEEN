from app import create_app

# Gunicorn on Render uses this exact variable:
# gunicorn run:app
app = create_app()

# Alternative WSGI name for some platforms:
application = app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
