# New Screeps Tools

Tools to help players of the Programming MMO Screeps.

### Hosted Option

A hosted option will be available at GitHub Pages soon.

### Building Planner

Plan your next room layout with the Building Planner for Screeps.

Features:
* Placing all Game structures on the room grid up to the limit for selected RCL
* Importing rooms terrains from official shards with an option to include existing structures
* Importing permanent room features (controller, sources, mineral)
* Roads are visually connected to adjacent roads
* Hold `left-click` and drag to place multiple structures
* Hold `right-click` or `shift`+`left-click` and drag to remove multiple structures
* Ramparts can be placed over structures and roads under containers
* Exporting JSON with structures and optionally terrain/room features in a compact format
* Importing exported structures from pasted JSON

![View the building planner](https://user-images.githubusercontent.com/10291543/95763564-6a0a6700-0c6c-11eb-9eb8-7325b98a4437.png)
(This image is from an old version)

### Creep Designer

Evaluate the potential of your creeps with the Creep Designer.

Features:
* Stats are shown based on body parts added
* Creep actions are listed based on body parts added
* Body parts can be boosted using the Boost dropdown
* Stats calculated "per tick", "per unit count", "per hour" and "per day"
* Tick duration option affects stats calculated "per hour" and "per day"

![View the creep designer](https://user-images.githubusercontent.com/10291543/95763598-78f11980-0c6c-11eb-9303-362c962876e4.png)
(This image is from an old version)

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

Build the React app using `npm run build`.

Run the python development server with the following steps:

```
source env/bin/activate
python3 main.py
deactivate # to stop the app and exit virtual environment
```

### Deployment

This will cover how to deploy screeps-tools with an Apache2 server.

* Install Apache2's `mod_proxy_uwsgi` (package `libapache2-mod-proxy-uwsgi` on Debian) and
  `mpm_itk_module` (package `libapache2-mpm-itk` on Debian) and turn them on with `a2enmod`.
* Create a new user account for screeps-tools. Install and build the React project with
  ```
  npm install
  npm run build-prod
  ```
  Install Python packages as described above, including `uwsgi`.
* Run the screeps-tools uWSGI server with `uwsgi --ini main.ini`.
  It is a good idea to make sure it launches after restarts, e.g.,
  by creating a systemd user service.
* Create an Apache2 configuration for the site in `sites-available` and later enable it with `a2ensite`:
```
<VirtualHost example.com:80>
    ServerName example.com

    # This is to make sure everything runs under its own user
    # Requires mpm_itk_module
    AssignUserId screeps-tools-user screeps-tools-user
    
    # Serving static files
    Alias /static /home/screeps-tools-user/screeps-tools/static
    <Directory /home/screeps-tools-user/screeps-tools/static>
        Options -Indexes
        Require all granted
    </Directory>
    
    # A reverse proxy to the uwsgi server ran locally on a free port (here 23456)
    # It uses unix sockets created by the uwsgi server in the root directory of the project
    # Requires mod_proxy_uwsgi
    ProxyRequests Off
    ProxyPreserveHost On
    Proxypass /static !
    ProxyPass / unix:/home/screeps-tools-user/screeps-tools/main.sock|uwsgi://localhost:23456/
    ProxyPassReverse / unix:/home/screeps-tools-user/screeps-tools/main.sock|uwsgi://localhost:23456/
    
    # Other standard definitions here (SSL, logs, etc.)
</VirtualHost>
```
* Restart Apache2.

### Note from the maintainer

If this project has not seen updated for a while and you want to become its
new maintainer, please try to contact me on the Screeps Discord
(https://discord.gg/screeps) or my email. If for whatever reason I will be
unreachable, please contact one of Screepers admins, e.g.,
AlinaNova21 (https://github.com/AlinaNova21), to give you permissions to
this repository. This is preferable to forking and publishing elsewhere
since this way players will not have to update the URL.

-- Xilexio, current maintainer