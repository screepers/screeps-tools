"""`main` is the top level module for your Flask application."""
# Note: You don't need to call app.run() when running `dev_appserver.py .` or deploying to App Engine,
# since the application is embedded within the App Engine WSGI application server.

from flask import Flask, render_template
app = Flask(__name__)

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, nothing to see here.', 404


@app.errorhandler(500)
def application_error(e):
    """Return a custom 500 error."""
    return 'Sorry, unexpected error: {}'.format(e), 500

@app.route('/')
def home():
    """Return a friendly HTTP greeting."""
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
