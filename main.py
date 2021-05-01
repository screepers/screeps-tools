import threading
import time
import os
from screepsapi import API as ScreepsAPI
from flask import Flask, render_template, json

app = Flask(__name__)

@app.errorhandler(404)
def page_not_found(e):
    """404 Page Not Found"""
    return 'Sorry, nothing to see here.', 404

@app.errorhandler(500)
def application_error(e):
    """500 Internal Server Error"""
    return 'Sorry, unexpected error: {}'.format(e), 500

@app.route('/api/shards/<server>')
def api_shards(server):
    """Get list of shards"""
    server = server if server else None
    screeps_api = get_screeps_api(server)
    api_res = screeps_api.shard_info()
    return app.response_class(
        response=json.dumps(api_res),
        status=200,
        mimetype='application/json'
    )

@app.route('/api/terrain/<world>/<shard>/<room>')
def api_terrain(world, shard, room):
    """Get the terrain details for a room"""
    world = world if world else None
    screeps_api = get_screeps_api(world)
    api_res = screeps_api.room_terrain(room=room, shard=shard, encoded=True)
    return app.response_class(
        response=json.dumps(api_res),
        status=200,
        mimetype='application/json'
    )

@app.route('/api/objects/<world>/<shard>/<room>')
def api_objects(world, shard, room):
    """Get the objects for a room"""
    world = world if world else None
    screeps_api = get_screeps_api(world)
    api_res = screeps_api.room_objects(room=room, shard=shard)
    return app.response_class(
        response=json.dumps(api_res),
        status=200,
        mimetype='application/json'
    )

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def home(path):
    """Homepage for React app"""
    cwd = os.path.dirname(os.path.realpath(__file__))
    build_time = int(os.path.getmtime(cwd + '/static/bundle.js'))
    return render_template("index.html", cache_buster=build_time)

def get_screeps_api(world):
    prefix = '/season' if world == 'season' else None
    return ScreepsAPI(
        host='screeps.com',
        prefix=prefix,
        secure=True
    )

if __name__ == "__main__":
    app.run()
