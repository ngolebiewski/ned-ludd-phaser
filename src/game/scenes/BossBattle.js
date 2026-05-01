import { Scene, Math as PhaserMath, Display, Geom } from "phaser";
import { Player } from "../entities/Player";
import { LaptopBoss } from "../entities/LaptopBoss";
import { TILES } from "../../Constants";

export class BossBattle extends Scene {
  constructor() {
    super("BossBattle");
  }

  create() {
    const { width, height } = this.scale;
    const TILE_SIZE = 64;
    this.playerHP = 10;
    this.isInvulnerable = false;
    this.isGameOver = false;

    // 1. MUSIC
    this.sound.stopAll();
    this.bossMusic = this.sound.add("factory_beatz");
    this.bossMusic.play({ loop: true, volume: 0.4, rate: 1.25 });

    // 2. BACKGROUND
    for (let x = 0; x < width; x += TILE_SIZE) {
      for (let y = 0; y < height; y += TILE_SIZE) {
        const v = PhaserMath.Between(-30, 30);
        const g = 110 + v;
        const bgTile = this.add
          .image(x + 32, y + 32, "factory", TILES.BG_TILE)
          .setOrigin(0.5)
          .setDepth(0)
          .setAlpha(0.9)
          .setTint(Display.Color.GetColor(g, g, g));
        bgTile.setAngle(PhaserMath.Between(0, 3) * 90);
      }
    }

    // 3. ARENA
    this.platforms = this.physics.add.staticGroup();
    // ONE layer of bricks at bottom
    const floorTopY = height - TILE_SIZE;
    for (let x = 0; x < width; x += TILE_SIZE) {
      this.platforms
        .create(x, floorTopY, "factory", TILES.BRICK)
        .setOrigin(0)
        .refreshBody();
    }

    // Raised Ledges
    const ledgeY = floorTopY - TILE_SIZE * 4;
    this.platforms
      .create(0, ledgeY, "factory", TILES.BRICK_WORN)
      .setOrigin(0)
      .setScale(3, 1)
      .refreshBody();
    this.platforms
      .create(width - 3 * TILE_SIZE, ledgeY, "factory", TILES.BRICK_WORN)
      .setOrigin(0)
      .setScale(3, 1)
      .refreshBody();

    // 4. PARTICLES
    this.particles = this.add.particles(0, 0, "factory", {
      frame: TILES.SMOKE,
      speed: 150,
      scale: { start: 0.8, end: 0 },
      lifespan: 500,
      emitting: false,
      blendMode: "ADD",
    });

    // 5. ENTITIES
    this.player = new Player(this, 100, floorTopY);
    this.player.setOrigin(0.5, 1); // Pivot at feet
    this.player.setDepth(10);

    LaptopBoss.createAnimations(this);
    this.boss = new LaptopBoss(this, width - 200, floorTopY);
    this.boss.setOrigin(0.5, 1); // Pivot at feet

    // 6. INTRO TEXT
    this.showTerminalText(
      "YOU HAVE DESTROYED MY MACHINES!\nYOU CAN ONLY DELAY THE FUTURE!\n\nSO SORRY YOU'RE OUT OF WORK...\nNOW YOU'LL BE SORRY!",
      () => {
        this.boss.isActive = true;
      },
    );

    // 7. COLLISIONS
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.boss, this.platforms);
    this.physics.add.overlap(this.player, this.boss, () => {
      if (this.player.isSmashing && !this.boss.isBeingHit) {
        this.boss.takeDamage();
        this.player.setVelocityY(-500);
        if (this.boss.hp <= 0) this.handleWin();
      } else if (
        !this.player.isSmashing &&
        !this.isInvulnerable &&
        this.boss.isActive
      ) {
        this.handlePlayerHit(false);
      }
    });
  }

  showTerminalText(content, onComplete) {
    const { width, height } = this.scale;
    const label = this.add
      .text(width / 2, height / 2, "", {
        fontFamily: "Departure Mono",
        fontSize: "22px",
        color: "#00ff00",
        align: "center",
        stroke: "#000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(100);

    let i = 0;
    this.time.addEvent({
      delay: 40,
      repeat: content.length - 1,
      callback: () => {
        label.text += content[i];
        i++;
        if (i === content.length) {
          this.time.delayedCall(1500, () => {
            this.tweens.add({
              targets: label,
              alpha: 0,
              duration: 500,
              onComplete: () => {
                label.destroy();
                if (onComplete) onComplete();
              },
            });
          });
        }
      },
    });
  }

  handlePlayerHit(isLaser = false) {
    if (this.isGameOver || this.isInvulnerable) return;
    this.playerHP--;
    isLaser
      ? this.cameras.main.flash(200, 0, 255, 0)
      : this.cameras.main.flash(200, 255, 0, 0);
    this.cameras.main.shake(200, 0.02);
    if (this.playerHP <= 0) this.handleGameOver();
    else {
      this.isInvulnerable = true;
      this.tweens.add({
        targets: this.player,
        alpha: 0.5,
        yoyo: true,
        repeat: 5,
        duration: 100,
        onComplete: () => {
          this.player.alpha = 1;
          this.isInvulnerable = false;
        },
      });
    }
  }

  handleGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.bossMusic.stop();
    const { width, height } = this.scale;
    const goText = this.add
      .text(width / 2, height / 2, "GAME OVER", {
        fontFamily: "Departure Mono",
        fontSize: "80px",
        color: "#ff0000",
        stroke: "#000",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setScale(0);
    this.tweens.add({
      targets: goText,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
      onComplete: () => {
        this.time.delayedCall(3000, () => this.scene.start("Title"));
      },
    });
  }

  handleWin() {
    this.isGameOver = true;
    this.boss.isActive = false;
    this.bossMusic.setRate(1.0);
    this.time.delayedCall(1000, () => {
      this.showTerminalText(
        "YOU ARE VICTORIOUS TODAY,\nBUT THE MACHINES ARE UNSTOPPABLE",
        () => {
          this.time.delayedCall(2000, () => {
            this.bossMusic.stop();
            this.scene.start("Title");
          });
        },
      );
    });
  }

  update(time) {
    if (!this.isGameOver) {
      this.player.update();
      this.boss.update(time);
    }
  }
}
