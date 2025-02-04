# SyncVideo API

Typescript Express API complementing [SyncVideo Client](https://github.com/gizinski-jacek/sync-video).
Handles chat messaging and users interactions with played video and playlist items.

## Table of contents

- [SyncVideo API](#syncvideo-api)
  - [Table of contents](#table-of-contents)
- [Github \& Live](#github--live)
  - [Getting Started](#getting-started)
  - [Deploy](#deploy)
  - [Features](#features)
  - [Status](#status)
  - [Contact](#contact)

# Github & Live

Github repo can be found [here](https://github.com/gizinski-jacek/fia-decisions-worker-api).

Frontend NextJS client can be found [here](https://github.com/gizinski-jacek/sync-video).

Live demo can be found on [Render](https://sync-video-api.onrender.com).

## Getting Started

Install all dependancies by running:

```bash
npm install
```

Queue worker needs Redis to function properly.\
Refer [to Redis documentation](https://redis.io/docs/getting-started/#install-redis) to install it locally.

In the project root directory run the app with:

```bash
npm start
```

## Deploy

You can easily deploy this app using [Heroku Platform](https://devcenter.heroku.com/articles/git).

In the project root directory run these commands:

```bash
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
heroku create
heroku addons:create heroku-redis
git push heroku main
heroku ps:scale worker=1
heroku open
```

Don't forget to add **.env** file with these environment variables for the app:

```
CLIENT_URI
```

## Features

- API endpoint for returning unique Id for creating new watch room or joining an existing one
- Implements socket.io for quick and low latency communication letting users:
  - Synchronized videos in real time
  - Synchronize new users to current video time
  - Room owner can seek currently played video
  - Change video playback rate
  - Reorder videos on playlist
  - Remove videos from playlist
  - Send messages in chat
  - View past chat messages

## Status

Project status: **_FINISHED_**

## Contact

Feel free to contact me at:

```
gizinski.jacek.tr@gmail.com
```
