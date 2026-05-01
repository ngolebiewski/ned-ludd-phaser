import { Scene, Math as PhaserMath, Display } from "phaser";
import { Player } from "../entities/Player";
import { Soldier } from "../entities/Soldier";
import {
  TILES,
  spawnWindow,
  spawnMachine,
  spawnGear,
  spawnPyramid,
} from "../../Constants";

export class MainGame extends Scene {
  constructor() {
    super("MainGame");
    this.isInvulnerable = false; // Persistent state for the cheat
  }

  create() {
    const { width, height } = this.scale;
    const levelWidth = 8000;
    this.isRestarting = false;

    // 0. INITIALIZE ASSETS
    Soldier.createAnimations(this);

    // Stop existing music if it exists
    if (this.factoryMusic && this.factoryMusic.isPlaying) {
      this.factoryMusic.stop();
    }

    // Play the music
    this.factoryMusic = this.sound.add("factory_song", {
      loop: true,
      volume: 0.5,
    });
    this.factoryMusic.play();

    // 1. CHEAT CODE LISTENERS
    // Toggle Invulnerability with 'I'
    this.input.keyboard.on("keydown-I", () => {
      this.isInvulnerable = !this.isInvulnerable;
      this.player.setAlpha(this.isInvulnerable ? 0.5 : 1);
      console.log("Invulnerability:", this.isInvulnerable);
    });

    // Skip to Boss with '9'
    this.input.keyboard.on("keydown-NINE", () => {
      this.scene.start("BossBattle");
    });

    // 2. BACKGROUND WALL TILES (Pixel Art Variance & 90deg rotation)
    for (let x = 0; x < levelWidth; x += 64) {
      for (let y = 0; y < height; y += 64) {
        const v = PhaserMath.Between(-30, 30);
        const g = 110 + v;
        const variationTint = Display.Color.GetColor(g, g, g);

        const bgTile = this.add
          .image(x + 32, y + 32, "factory", TILES.BG_TILE)
          .setOrigin(0.5)
          .setDepth(0)
          .setAlpha(0.9)
          .setTint(variationTint);

        bgTile.setAngle(PhaserMath.Between(0, 3) * 90);
      }
    }

    // 3. WINDOWS
    for (let x = 400; x < levelWidth; x += 7 * 64) {
      this.spawnGrimyWindow(x, 128);
    }

    // 4. GROUPS
    this.platforms = this.physics.add.staticGroup();
    this.machineGroup = this.physics.add.staticGroup();
    this.enemyGroup = this.physics.add.group({ runChildUpdate: true });

    // 5. TERRAIN & ENEMY GENERATION
    this.generateTerrain(levelWidth, height);

    // 6. PLAYER & SYSTEMS
    this.setupPlayerAndSystems(levelWidth, height);

    // 7. MACHINES
    [1500, 3000, 4500, 6000, 7500].forEach((x) => {
      this.spawnMachineSafely(
        x,
        Math.random() > 0.5 ? TILES.JENNY : TILES.STOCKING,
      );
    });

    // 8. PHYSICS COLLIDERS
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemyGroup, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.enemyGroup,
      (player, enemy) => {
        if (player.isSmashing) {
          this.handleEnemySmash(enemy);
        } else if (!this.isInvulnerable) {
          this.handleDeath();
        }
      },
      null,
      this,
    );
  }

  generateTerrain(levelWidth, height) {
    let currentX = 0;

    // STARTING FLOOR: Solid ground for 12 tiles to prevent air-spawn issues
    for (let i = 0; i < 12; i++) {
      this.platforms
        .create(i * 64, height - 64, "factory", TILES.BRICK)
        .setOrigin(0)
        .refreshBody();
    }
    currentX = 12 * 64;

    while (currentX < levelWidth) {
      const chunkWidth = PhaserMath.Between(6, 12);
      const isDoubleThick = Math.random() > 0.5;

      // MAIN FLOOR
      for (let i = 0; i < chunkWidth; i++) {
        const xPos = currentX + i * 64;
        this.platforms
          .create(xPos, height - 64, "factory", TILES.BRICK)
          .setOrigin(0)
          .setDepth(5)
          .refreshBody();
        if (isDoubleThick) {
          this.platforms
            .create(xPos, height - 128, "factory", TILES.BRICK_WORN)
            .setOrigin(0)
            .setDepth(5)
            .refreshBody();
        }
      }

      // MORE SOLDIERS
      if (Math.random() > 0.4) {
        this.enemyGroup.add(
          new Soldier(this, currentX + 128, height - 130, "patrol"),
        );
      }

      // CATWALKS
      if (Math.random() > 0.6) {
        const t2X = currentX + 128;
        const t2Y = height - 352;
        for (let j = 0; j < 5; j++) {
          this.platforms
            .create(t2X + j * 64, t2Y, "factory", TILES.BRICK_WORN)
            .setOrigin(0)
            .setDepth(5)
            .refreshBody();
        }
        this.enemyGroup.add(new Soldier(this, t2X + 64, t2Y - 10, "patrol"));
      }

      const gapSize = PhaserMath.Between(2, 4);
      this.spawnPitGears(currentX + chunkWidth * 64, gapSize);
      currentX += (chunkWidth + gapSize) * 64;
    }
  }

  spawnPitGears(gapStartX, gapSize) {
    const gearY = this.scale.height + 50;
    for (let i = 0; i < gapSize; i++) {
      const gx = gapStartX + i * 64 + 32;
      spawnGear(
        this,
        gx,
        gearY,
        27 + PhaserMath.Between(0, 4),
        2,
        0.4,
        i % 2 === 0 ? 1 : -1,
      )
        .setDepth(1)
        .setAlpha(0.4)
        .setTint(0x333333);
    }
  }

  setupPlayerAndSystems(levelWidth, height) {
    this.particles = this.add.particles(0, 0, "factory", {
      frame: TILES.SMOKE,
      speed: 150,
      scale: { start: 1, end: 0 },
      lifespan: 400,
      emitting: false,
    });

    this.player = new Player(this, 100, height - 250);
    this.player.setDepth(10);
    if (this.isInvulnerable) this.player.setAlpha(0.5);

    this.cameras.main.setBounds(0, 0, levelWidth, height);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.physics.world.setBounds(0, -800, levelWidth, height + 300);
    this.physics.world.checkCollision.down = false;
  }

  update() {
    if (this.player && this.player.active) {
      this.player.update();
      if (this.player.isSmashing) this.checkSmashHit();

      // TRANSITION TO BOSS
      if (this.player.x > 7950) {
        this.scene.start("BossBattle");
      }

      // PIT CHECK
      if (this.player.y > this.scale.height + 100 && !this.isInvulnerable) {
        this.handleDeath();
      }
    }
  }

  // Inside MainGame.js
  checkSmashHit(hitSource) {
    // Use the hitSource (the invisible rectangle) instead of the player
    const source = hitSource || this.player;

    this.physics.overlap(source, this.enemyGroup, (hitbox, enemy) => {
      this.handleEnemySmash(enemy);
    });

    this.physics.overlap(source, this.machineGroup, (hitbox, part) => {
      if (!part.isBeingHit) this.handleMachineDamage(part);
    });
  }

  handleEnemySmash(enemy) {
    if (!enemy.active) return;
    this.particles.emitParticleAt(enemy.x, enemy.y - 30, 15);
    this.cameras.main.shake(100, 0.01);
    enemy.setActive(false);
    enemy.body.setEnable(false);
    enemy.setTint(0xff0000);
    this.tweens.add({
      targets: enemy,
      y: enemy.y - 250,
      x: enemy.x + (this.player.flipX ? -300 : 300),
      angle: 720,
      alpha: 0,
      duration: 800,
      onComplete: () => enemy.destroy(),
    });
  }

  handleMachineDamage(part) {
    part.isBeingHit = true;
    part.health = (part.health || 3) - 1;
    this.particles.emitParticleAt(part.x + 32, part.y + 32, 10);
    this.cameras.main.shake(100, 0.005);
    part.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      if (part.active) {
        part.clearTint();
        part.isBeingHit = false;
      }
    });
    if (part.health <= 0) part.destroy();
  }

  handleDeath() {
    if (this.isRestarting || this.isInvulnerable) return;
    this.isRestarting = true;

    this.cameras.main.shake(250, 0.02);
    this.cameras.main.flash(500, 150, 0, 0);

    this.player.setActive(false).setVisible(false);
    this.physics.pause();

    this.time.delayedCall(600, () => {
      this.isRestarting = false;
      this.scene.restart();
    });
  }

  spawnGrimyWindow(x, y) {
    TILES.WINDOW.forEach((row, rowIndex) => {
      row.forEach((frame, colIndex) => {
        this.add
          .image(x + colIndex * 64, y + rowIndex * 64, "factory", frame)
          .setOrigin(0)
          .setTint(0x888888)
          .setDepth(0);
      });
    });
  }

  spawnMachineSafely(targetX, layout) {
    const floorTiles = this.platforms
      .getChildren()
      .filter((p) => Math.abs(p.x - targetX) < 128);
    if (floorTiles.length > 0) {
      const highestTile = floorTiles.reduce((prev, curr) =>
        prev.y < curr.y ? prev : curr,
      );
      spawnMachine(
        this,
        highestTile.x,
        highestTile.y - layout.length * 64,
        layout,
        this.machineGroup,
      );
    }
  }
}
