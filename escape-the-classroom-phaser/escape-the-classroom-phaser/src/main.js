// Phaser platformer with human sprite, parallax bg, textures, sounds (local assets)

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

  preload(){
    // Images
    this.load.image('sky',     'assets/images/sky.png');
    this.load.image('clouds',  'assets/images/clouds.png');
    this.load.image('ground',  'assets/images/ground.png');
    this.load.spritesheet('hero', 'assets/images/dude.png', { frameWidth: 32, frameHeight: 48 });

    // Audio
    this.load.audio('jump', 'assets/audio/jump.wav');
    this.load.audio('coin', 'assets/audio/coin.wav');
    this.load.audio('hit',  'assets/audio/hit.wav');
  }

  create(){
    // Parallax background
    this.sky = this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'sky').setOrigin(0).setScrollFactor(0);
    this.clouds = this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'clouds').setOrigin(0).setScrollFactor(0.3).setAlpha(0.7);

    this.physics.world.setBounds(0, 0, MAP[0].length*TILE, MAP.length*TILE);

    this.platforms = this.physics.add.staticGroup();
    this.hazards   = this.physics.add.staticGroup();
    this.keysGrp   = this.physics.add.staticGroup();
    this.door      = null;

    // Build from ASCII (draw ground as physics bodies; visuals are separate tileSprites)
    for (let y=0;y<MAP.length;y++){
      for (let x=0;x<MAP[y].length;x++){
        const ch = MAP[y][x];
        const px = x*TILE, py = y*TILE;
        if (ch === '#'){
          // physics body
          const img = this.physics.add.staticImage(px+TILE/2, py+TILE/2, 'ground').setDisplaySize(TILE,TILE);
          img.refreshBody();
          this.platforms.add(img);
        }
        if (ch === 'X'){
          const body = this.physics.add.staticImage(px+TILE/2, py+TILE*0.75, null);
          body.setSize(TILE-16, TILE-20).refreshBody();
          body.kind = 'hazard';
          this.hazards.add(body);
        }
        if (ch === 'K'){
          const body = this.physics.add.staticImage(px+TILE/2, py+TILE/2, null);
          body.setSize(TILE-22, TILE-22).refreshBody();
          body.kind = 'key';
          this.keysGrp.add(body);
        }
        if (ch === 'D'){
          const body = this.physics.add.staticImage(px+TILE/2, py+TILE/2, null);
          body.setSize(TILE-16, TILE-16).refreshBody(); this.door = body;
        }
      }
    }

    // Visual overlay for hazards/keys/door
    this.fx = this.add.graphics();
    this.fx.fillStyle(0xf87171, 1);
    this.hazards.getChildren().forEach(h => this.fx.fillRoundedRect(h.x-(TILE-16)/2, h.y-(TILE-20)/2, TILE-16, TILE-20, 8));
    this.fx.fillStyle(0xfacc15, 1);
    this.keysGrp.getChildren().forEach(k => this.fx.fillRoundedRect(k.x-(TILE-22)/2, k.y-(TILE-22)/2, TILE-22, TILE-22, 8));
    this.fx.fillStyle(0x34d399, 1);
    if (this.door) this.fx.fillRoundedRect(this.door.x-(TILE-16)/2, this.door.y-(TILE-16)/2, TILE-16, TILE-16, 8);
    this.fx.setDepth(2);

    // Hero
    this.hero = this.physics.add.sprite(64, MAP.length*TILE - 4*TILE, 'hero', 4)
      .setCollideWorldBounds(true).setBounce(0.0).setDepth(5);
    this.hero.body.setSize(20, 40).setOffset(6,8);

    // Animations
    this.anims.create({ key: 'idle', frames: [{ key:'hero', frame:4 }], frameRate: 1, repeat: -1 });
    this.anims.create({ key: 'run',  frames: this.anims.generateFrameNumbers('hero', { start:0, end:3 }), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'jump', frames: [{ key:'hero', frame:5 }], frameRate: 1 });

    // Collisions
    this.physics.add.collider(this.hero, this.platforms);

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysAD = this.input.keyboard.addKeys('A,D,W,SPACE');

    // Sounds
    this.jumpS = this.sound.add('jump', {volume:0.5});
    this.coinS = this.sound.add('coin', {volume:0.5});
    this.hitS  = this.sound.add('hit',  {volume:0.5});

    // Overlaps
    this.collected = 0;
    this.totalKeys = this.keysGrp.getChildren().length;
    window.__HUD__.setKeys(this.collected, this.totalKeys);

    this.physics.add.overlap(this.hero, this.keysGrp, (_pl, kBody) => {
      // remove from visuals:
      this.fx.fillStyle(0x0,0); // do nothing further; visuals remain simple
      kBody.destroy();
      this.collected++; window.__HUD__.setKeys(this.collected, this.totalKeys);
      this.coinS?.play();
    });

    this.physics.add.overlap(this.hero, this.door, () => {
      if (this.collected === this.totalKeys) this.onWin();
    });

    this.physics.add.overlap(this.hero, this.hazards, () => this.onDeath());

    // Camera
    this.cameras.main.setBounds(0,0,MAP[0].length*TILE, MAP.length*TILE);
    this.cameras.main.startFollow(this.hero, true, 0.08, 0.08);

    // Timer & reset
    this.elapsed = 0;
    window.__RESET__ = () => this.scene.restart();
  }

  update(_t, dt){
    this.elapsed += dt/1000; window.__HUD__.setTime(this.elapsed);

    const left  = this.cursors.left.isDown || this.keysAD.A.isDown;
    const right = this.cursors.right.isDown || this.keysAD.D.isDown;
    const onGround = this.hero.body.blocked.down;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keysAD.W);

    if (left)  { this.hero.setVelocityX(-220); this.hero.setFlipX(true); }
    else if (right) { this.hero.setVelocityX(220); this.hero.setFlipX(false); }
    else this.hero.setVelocityX(0);

    if (jumpPressed && onGround){
      this.hero.setVelocityY(-560);
      this.jumpS?.play();
    }

    if (!onGround) this.hero.anims.play('jump', true);
    else if (left || right) this.hero.anims.play('run', true);
    else this.hero.anims.play('idle', true);

    // Parallax scroll
    this.sky.tilePositionX = this.cameras.main.scrollX * 0.2;
    this.clouds.tilePositionX = this.cameras.main.scrollX * 0.5;

    if (this.hero.y > MAP.length*TILE + 200) this.onDeath();
  }

  onDeath(){
    if (this.won) return;
    this.hitS?.play();
    this.scene.pause();
    this.banner('Oops! Chemical spill. Press Reset.');
  }
  onWin(){
    if (this.won) return;
    this.won = true;
    this.scene.pause();
    this.banner('You escaped! 🥳 Press Reset to play again.');
  }
  banner(text){
    const {centerX} = this.cameras.main;
    const box = this.add.rectangle(centerX, 80, 640, 56, 0x000000, 0.45)
      .setStrokeStyle(1, 0xffffff, 0.06).setScrollFactor(0).setDepth(1000);
    const label = this.add.text(centerX, 80, text, {
      fontSize:'22px', fontStyle:'bold', color:'#e5e7eb', fontFamily:'system-ui'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
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
