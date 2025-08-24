# Escape the Classroom — Phaser Edition

A ready-to-upload Phaser 3 platformer starter with a human sprite, parallax background,
tileable ground texture, and simple jump/coin/hit sounds.

## Structure
```
escape-the-classroom-phaser/
├── index.html
├── src/
│   └── main.js
└── assets/
    ├── images/
    │   ├── sky.png
    │   ├── clouds.png
    │   ├── ground.png
    │   └── dude.png
    └── audio/
        ├── jump.wav
        ├── coin.wav
        └── hit.wav
```

## Run locally
Open `index.html` or serve:
```
python -m http.server 5500
# visit http://localhost:5500
```

## Publish with GitHub Pages
1. Create a GitHub repo, e.g. `escape-the-classroom-phaser`.
2. Push these files.
3. In the repo: **Settings → Pages → Deploy from branch** → `main` + `/ (root)` → Save.
4. Open the URL it gives you.

## Controls
- Move: A/D or ←/→
- Jump: W/↑ or Space
