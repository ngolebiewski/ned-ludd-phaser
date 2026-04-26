import { Scene, Math as PhaserMath } from "phaser";
import { Player } from "../entities/Player";
import { TILES, spawnWindow, spawnMachine, spawnGear, spawnPyramid } from "../../Constants";

export class MainGame extends Scene {
  constructor() {
    super("MainGame");
  }

  create() {
    const { width, height } = this.scale;
    const levelWidth = 8000;

    // 0. AUDIO
    if (!this.sound.get("factory_song")) {
      this.sound.play("factory_song", { loop: true, volume: 0.3 });
    }

    // 1. BACKGROUND WALL (Restored Pixel Texture)
    // We loop through the entire level width and height to tile the BG
    for (let x = 0; x < levelWidth; x += 64) {
      for (let y = 0; y < height; y += 64) {
        const bgTile = this.add.image(x, y, "factory", TILES.BG_TILE).setOrigin(0);
        bgTile.setAlpha(0.15).setTint(0x222222).setDepth(0);
        // Optional: slight random rotation for variety if the tile allows
        bgTile.setAngle([0, 90, 180, 270][PhaserMath.Between(0, 3)]);
      }
    }

    // 2. WINDOWS & GEARS (Mid-ground layers)
    for (let x = 400; x < levelWidth; x += (7 * 64)) {
      this.spawnGrimyWindow(x, 128);
    }

    for (let i = 0; i < 85; i++) {
      const rx = PhaserMath.Between(0, levelWidth);
      const ry = PhaserMath.Between(50, height - 100);
      spawnGear(this, rx, ry, 27 + PhaserMath.Between(0, 4), PhaserMath.Between(2, 4), 0.2, Math.random() > 0.5 ? 1 : -1)
        .setDepth(1).setAlpha(0.7);
    }

    // 3. PLATFORMS & GROUPS
    this.platforms = this.physics.add.staticGroup();
    this.machineGroup = this.physics.add.staticGroup(); 
    
    this.generateTerrain(levelWidth, height);

    // 4. PLAYER & SYSTEMS
    this.setupPlayerAndSystems(levelWidth, height);

    // 5. MACHINES
    [1500, 3000, 4500, 6000, 7500].forEach(x => {
        this.spawnMachineSafely(x, Math.random() > 0.5 ? TILES.JENNY : TILES.STOCKING);
    });
  }

  generateTerrain(levelWidth, height) {
    let currentX = 0;
    while (currentX < levelWidth) {
      const chunkWidth = PhaserMath.Between(6, 12);
      const isDoubleThick = Math.random() > 0.5;
      
      // TIER 1: FLOOR
      for (let i = 0; i < chunkWidth; i++) {
        const xPos = currentX + (i * 64);
        this.platforms.create(xPos, height - 32, "factory", TILES.BRICK).setDepth(5).refreshBody();
        if (isDoubleThick) {
          this.platforms.create(xPos, height - 96, "factory", TILES.BRICK_WORN).setDepth(5).refreshBody();
        }
      }

      // TIER 2: MID CATWALKS (Clearance for Ned)
      if (Math.random() > 0.6 && currentX > 800) {
        const t2X = currentX + 128; // Offset for landing
        const t2Y = height - 352; 
        for (let j = 0; j < 5; j++) {
          this.platforms.create(t2X + (j * 64), t2Y, "factory", TILES.BRICK_WORN).setDepth(5).refreshBody();
        }
      }

      const gapSize = PhaserMath.Between(2, 4);
      currentX += (chunkWidth + gapSize) * 64; 
    }
    spawnPyramid(this, this.platforms, 2000, height - 96, 5);
  }

  setupPlayerAndSystems(levelWidth, height) {
    this.particles = this.add.particles(0, 0, "factory", {
      frame: TILES.SMOKE, speed: 150, scale: { start: 1, end: 0 }, lifespan: 400, emitting: false
    });

    this.player = new Player(this, 100, height - 400);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.platforms);
    
    this.cameras.main.setBounds(0, 0, levelWidth, height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // CRITICAL: Expand top bounds to -800 so your -1050 jump doesn't hit a ceiling
    this.physics.world.setBounds(0, -800, levelWidth, height + 1000); 
  }

  update() {
    if (this.player && this.player.active) {
      this.player.update();
      if (this.player.y > this.scale.height + 100) this.handleDeath();
    }
  }

  handleDeath() {
    this.player.setActive(false).setVisible(false);
    this.cameras.main.shake(250, 0.02);
    this.cameras.main.flash(500, 100, 0, 0); 
    this.time.delayedCall(600, () => {
      this.player.setPosition(100, this.scale.height - 400);
      this.player.body.setVelocity(0, 0);
      this.player.setActive(true).setVisible(true);
      this.cameras.main.fadeIn(400);
    });
  }

  checkSmashHit() {
    this.physics.overlap(this.player, this.machineGroup, (player, part) => {
      if (!part.isBeingHit) this.handleMachineDamage(part);
    });
  }

  handleMachineDamage(part) {
    part.isBeingHit = true;
    part.health = (part.health || 3) - 1;
    this.particles.emitParticleAt(part.x + 32, part.y + 32, 10);
    this.cameras.main.shake(100, 0.005);
    part.setTint(0xff0000);
    this.time.delayedCall(200, () => { if (part.active) { part.clearTint(); part.isBeingHit = false; }});
    if (part.health <= 0) { this.spawnFallingRubble(part.x, part.y); part.destroy(); }
  }

  spawnFallingRubble(x, y) {
    const rubble = this.physics.add.sprite(x, y, "factory", TILES.RUBBLE[PhaserMath.Between(0, 1)]).setOrigin(0);
    rubble.setTint(0x888888).setAlpha(0.8).setDepth(6).setVelocity(PhaserMath.Between(-80, 80), -200);
    this.physics.add.collider(rubble, this.platforms, () => {
      rubble.setImmovable(true);
      if (rubble.body) { rubble.body.setAllowGravity(false); rubble.setVelocity(0); }
    });
  }

  spawnGrimyWindow(x, y) {
    TILES.WINDOW.forEach((row, rowIndex) => {
      row.forEach((frame, colIndex) => {
        this.add.image(x + (colIndex * 64), y + (rowIndex * 64), 'factory', frame)
          .setOrigin(0).setTint(0x666666).setDepth(0);
      });
    });
  }

  spawnMachineSafely(targetX, layout) {
    const floorTiles = this.platforms.getChildren().filter(p => Math.abs(p.x - targetX) < 128);
    if (floorTiles.length > 0) {
        const highestTile = floorTiles.reduce((prev, curr) => (prev.y < curr.y) ? prev : curr);
        spawnMachine(this, highestTile.x, highestTile.y - (layout.length * 64), layout, this.machineGroup);
        this.machineGroup.getChildren().forEach(tile => tile.setDepth(6));
    }
  }
}