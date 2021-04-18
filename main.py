"""`main` is the top level module for your Flask application."""
# Note: You don't need to call app.run() when running `dev_appserver.py .` or deploying to App Engine,
# since the application is embedded within the App Engine WSGI application server.

import threading
import time
from screepsapi import API as ScreepsAPI
from flask import Flask, render_template, json

app = Flask(__name__)

screeps_api = ScreepsAPI(
    host='screeps.com',
    secure=True
)

@app.errorhandler(404)
def page_not_found(e):
    """404 Page Not Found"""
    return 'Sorry, nothing to see here.', 404

@app.errorhandler(500)
def application_error(e):
    """500 Internal Server Error"""
    return 'Sorry, unexpected error: {}'.format(e), 500

@app.route('/')
def home():
    """Return a friendly HTTP greeting."""
    return render_template("index.html")

@app.route('/api/shards')
def api_shards():
    """Get list of shards"""
    api_res = screeps_api.shard_info()
    return app.response_class(
        response=json.dumps(api_res),
        status=200,
        mimetype='application/json'
    )

@app.route('/api/terrain/<shard>/<room>')
def api_terrain():
    """Get the terrain details for a room"""
    api_res = screeps_api.room_terrain(room=room, shard=shard, encoded=True)
    return app.response_class(
        response=json.dumps(api_res),
        status=200,
        mimetype='application/json'
    )

@app.route('/api/objects/<shard>/<room>')
def api_objects():
    """Get the objects for a room"""
    api_res = screeps_api.room_objects(room=room, shard=shard)
    return app.response_class(
        response=json.dumps(api_res),
        status=200,
        mimetype='application/json'
    )

def start_runner():
    """Start the Screeps API connection runner"""
    def start_loop():
        not_started = True
        while not_started:
            try:
                if screeps_api is not None:
                    print('Screeps API connected!')
                    not_started = False
            except:
                print('Screeps API not yet connected')
            time.sleep(2)

    print('Started runner')
    thread = threading.Thread(target=start_loop)
    thread.start()

if __name__ == "__main__":
    start_runner()
    app.run(debug=True)
