# Screeps Tools

Tools to help players of the Programming MMO Screeps.

### Hosted Option

A hosted option is available on
[GitHub Pages](https://screepers.github.io/screeps-tools).

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

### Support and community

Feel free to drop by on #screepers on the official
[Screeps Discord](https://discord.gg/screeps). 

## Development

The screeps-tools is a React-based mostly static website that can be built
and opened from your local machine.

The one part that is not static is screeps.com API.
Due to CORS security measures implemented in browsers, it is not possible to
make a request to screeps.com from another domain without screeps.com
setting a response header to allow that. Currently screeps.com does not do
that, so a proxy server is required.

### Requirements

* [Node.js](https://nodejs.org/en/) v18+
* A CORS proxy server

### Build

Download or clone this repository and then run `npm install` in the root
directory to install node modules.

Build the React app using `npm run build`.
The complete static page is now available in the `static` directory.

### Deployment

To deploy screeps-tools to GitHub Pages using `gh-pages`, run `npm run deploy`.

The URL of the proxy server is currently hardcoded in
`src/components/common/constants.ts` in constant `PROXY_SERVER_URL`.

To deploy your own screeps.com API proxy server in Apache2, you can use
this configuration:
```
ProxyRequests off
ProxyPreserveHost off
SSLProxyEngine on
ProxyPass /api/ https://screeps.com/api/
ProxyPassReverse /api/ https://screeps.com/api/
ProxyPass /season/api/ https://screeps.com/season/api/
ProxyPassReverse /season/api/ https://screeps.com/season/api/
```

### Note from the maintainer

If this project has not seen updated for a while and you want to become its
new maintainer, please try to contact me on the
[Screeps Discord](https://discord.gg/screeps) or my email.
If for whatever reason I will be unreachable, please contact one of
Screepers admins, e.g., [AlinaNova21](https://github.com/AlinaNova21),
to give you permissions to this repository.
This is preferable to forking and publishing elsewhere
since this way players will not have to update the URL.

-- [Xilexio](https://github.com/xilexio), current maintainer

### Old versions

Archival versions from previous maintainers can be found on GitHub:
* [admon84](https://github.com/admon84/screeps-tools)
* [Arcath](https://github.com/Arcath/screeps-tools)