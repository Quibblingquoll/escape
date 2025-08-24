// Minimal Phaser 3 platformer with ASCII level

const TILE = 48;
const WIDTH = 960, HEIGHT = 540;

const MAP = [
  '........................................................................',
  '........................................................................',
  '.....................K..................................................',
  '.........................####.....................K......................',
  '..............#####......................####............................',
  '........................................................................',
  '....####..............XXX.....................####.............D.........',
  '........................................................................',
  '########........K..................#########................#############',
  '#########################################################################',
];

class Play extends Phaser.Scene {
  constructor(){ super('Play'); }

  create(){
    this.cameras.main.setBackgroundColor('#0b1020');
    this.physics.world.setBounds(0,0,MAP[0].length*TILE, MAP.length*TILE);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.keys = this.physics.add.staticGroup();
    this.door = null;

    // Build level
    for(let y=0;y<MAP.length;y++){
      for(let x=0;x<MAP[y].length;x++){
        const ch = MAP[y][x];
        const px = x*TILE, py = y*TILE;
        if (ch === '#') this.platforms.add(this.addRect(px,py,TILE,TILE,'#1f2937'), true);
        if (ch === 'X') this.hazards.add(this.addRect(px+8,py+24,TILE-16,TILE-28,'#f87171'), true);
        if (ch === 'K') this.keys.add(this.addRect(px+12,py+12,TILE-24,TILE-24,'#facc15'));
        if (ch === 'D') this.door = this.addRect(px+8,py+8,TILE-16,TILE-16,'#34d399');
      }
    }

    // Player
    this.player = this.physics.add.sprite(64, MAP.length*TILE - 4*TILE, undefined)
      .setDisplaySize(32,46)
      .setTint(0x38bdf8)
      .setDragX(900)
      .setMaxVelocity(260, 1000)
      .setCollideWorldBounds(true);
    this.player.body.setSize(32,46);

    // Collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.overlap(this.player, this.hazards, () => this.onDeath(), null, this);

    // Keys
    this.collected = 0;
    this.totalKeys = this.keys.getChildren().length;
    window.__HUD__.setKeys(this.collected, this.totalKeys);
    this.physics.add.overlap(this.player, this.keys, (pl, key) => {
      key.destroy();
      this.collected++;
      window.__HUD__.setKeys(this.collected, this.totalKeys);
    });

    // Door
    this.physics.add.overlap(this.player, this.door, () => {
      if (this.collected === this.totalKeys) this.onWin();
    });

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysAD = this.input.keyboard.addKeys('A,D,W');

    this.elapsed = 0;
    window.__RESET__ = () => this.scene.restart();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0,0,MAP[0].length*TILE, MAP.length*TILE);
  }

  addRect(x,y,w,h,color){
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    g.fillRoundedRect(0,0,w,h,8);
    const tx = g.generateTexture(`r${x}_${y}`, w, h);
    g.destroy();
    const s = this.physics.add.staticImage(x + w/2, y + h/2, `r${x}_${y}`);
    s.refreshBody();
    return s;
  }

  onDeath(){
    if (this.won) return;
    this.scene.pause();
    this.addBanner('Oops! Chemical spill. Press Reset.');
  }

  onWin(){
    if (this.won) return;
    this.won = true;
    this.scene.pause();
    this.addBanner('You escaped! 🥳 Press Reset to play again.');
  }

  addBanner(text){
    const {centerX} = this.cameras.main;
    const banner = this.add.text(centerX, 80, text, {
      fontSize: '22px', fontStyle:'bold', color:'#e5e7eb',
      fontFamily:'system-ui'
    }).setOrigin(0.5);
    const box = this.add.rectangle(centerX, 80, 640, 56, 0x000000, 0.45)
      .setStrokeStyle(1, 0xffffff, 0.06).setOrigin(0.5);
    this.children.bringToTop(banner);
  }

  update(time, delta){
    if (!this.won){ this.elapsed += delta/1000; window.__HUD__.setTime(this.elapsed); }

    const onGround = this.player.body.blocked.down;
    const left = this.cursors.left.isDown || this.keysAD.A.isDown;
    const right = this.cursors.right.isDown || this.keysAD.D.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                 Phaser.Input.Keyboard.JustDown(this.keysAD.W) ||
                 Phaser.Input.Keyboard.JustDown(this.cursors.space);

    if (left) this.player.setAccelerationX(-1200);
    else if (right) this.player.setAccelerationX(1200);
    else this.player.setAccelerationX(0);

    if (jump && onGround) this.player.setVelocityY(-560);

    if (this.player.y > MAP.length*TILE + 200) this.onDeath();
  }
}

const config = {
  type: Phaser.CANVAS,
  width: WIDTH,
  height: HEIGHT,
  canvas: document.getElementById('game'),
  physics: { default: 'arcade', arcade: { gravity: { y: 1400 }, debug: false } },
  scene: [Play],
};

new Phaser.Game(config);
