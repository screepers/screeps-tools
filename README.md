# New Screeps Tools

Tools to help players of the Programming MMO Screeps.

### Hosted Option

The hosted option is available for convenience at [screeps.admon.dev](https://screeps.admon.dev)

### Building Planner

Plan your next room layout with the Building Planner for Screeps.

Features:
* All Game structures
* Import rooms from official shards with an option to include existing structures
* Importing rooms always static game objects (controller, sources, mineral)
* Roads are visually connected to adjacent roads
* Hold left-click and drag to place multiple structures
* Hold right-click and drag to remove multiple structures
* Ramparts can be placed over structures easily

![View the building planner](https://user-images.githubusercontent.com/10291543/95763564-6a0a6700-0c6c-11eb-9eb8-7325b98a4437.png)

### Creep Designer

Evaluate the potential of your creeps with the Creep Designer.

Features:
* Stats are shown based on body parts added
* Creep actions are listed based on body parts added
* Body parts can be boosted using the Boost dropdown
* Stats calculated "per tick", "per unit count", "per hour" and "per day"
* Tick duration option affects stats calculated "per hour" and "per day"

![View the creep designer](https://user-images.githubusercontent.com/10291543/95763598-78f11980-0c6c-11eb-9303-362c962876e4.png)

## Development

The screeps-tools application can be installed and ran from your local machine.

### Requirements

* [Node.js](https://nodejs.org/en/) v10+
* [Python](https://www.python.org/downloads/) v3.6+

### Install

Download or clone this repository and then run `npm install` in the root directory to install node modules.

Install python packages with the following steps:

```
python3 -m venv env
source env/bin/activate
pip install --upgrade pip
pip install wheel
pip install flask uwsgi # note: skip uwsgi for local development
pip install git+https://github.com/admon84/python-screeps.git@v0.5.2#egg=screepsapi
deactivate
```

Build the react app using `npm run build`

Run the python development server with the following steps:

```
source env/bin/activate
python3 main.py
deactivate # to stop the app and exit virtual environment
```