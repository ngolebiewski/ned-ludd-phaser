import { Physics, Math as PhaserMath } from "phaser";

export class Soldier extends Physics.Arcade.Sprite {
  constructor(scene, x, y, type = "patrol") {
    super(scene, x, y, "soldier");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.aiType = type;
    this.setOrigin(0.5, 1);
    this.setCollideWorldBounds(true);
    this.setDepth(9);
    
    // Updated to 1.25 scale
    this.setScale(1.25);
    // 1. Set the internal size (based on the 80x128 source)
    // We make it 60px wide and 110px tall to be more "player-friendly"
    this.body.setSize(60, 110); 

    // 2. Calculate the offset to center it
    // Width: (80 total - 60 hitbox) / 2 = 10px offset from the left
    // Height: (128 total - 110 hitbox) = 18px offset from the top
    this.body.setOffset(10, 18);

    // Physics Tuning
    this.body.setGravityY(1000); 
    this.patrolSpeed = 100;
    this.direction = 1; // 1 is Right, -1 is Left
    this.lastShotTime = 0;
    this.shootInterval = 4000;

    if (this.aiType === "patrol") {
      this.play("soldier-walk");
    } else {
      this.play("soldier-shoot");
      this.setImmovable(true);
    }
  }

  static createAnimations(scene) {
    if (!scene.anims.exists("soldier-walk")) {
      scene.anims.create({
        key: "soldier-walk",
        frames: scene.anims.generateFrameNames("soldier", {
          prefix: "soldier ",
          suffix: ".aseprite",
          start: 0,
          end: 0,
        }),
      });
      scene.anims.create({
        key: "soldier-shoot",
        frames: scene.anims.generateFrameNames("soldier", {
          prefix: "soldier ",
          suffix: ".aseprite",
          start: 1,
          end: 1,
        }),
      });
    }
  }

  update(time) {
    if (!this.active || !this.body) return;

    if (this.aiType === "patrol") {
      this.handlePatrol();
    } else if (this.aiType === "sentry") {
      this.handleSentry(time);
    }
  }

  handlePatrol() {
    if (!this.body || !this.active) return;

    // 1. Wall turn
    if (this.body.blocked.left || this.body.blocked.right) {
      this.direction *= -1;
    }

    // 2. Smart Pit Check
    if (this.body.blocked.down) {
      const checkX = this.x + this.direction * 32;
      const checkY = this.y + 10;
      let groundFound = false;

      const platforms = this.scene.platforms.getChildren();
      for (let i = 0; i < platforms.length; i++) {
        if (platforms[i].getBounds().contains(checkX, checkY)) {
          groundFound = true;
          break;
        }
      }

      if (!groundFound) {
        this.direction *= -1;
      }
    }

    this.setVelocityX(this.patrolSpeed * this.direction);
    
    // Logic: Sprite faces RIGHT natively. 
    // Flip when moving LEFT (direction === -1).
    this.setFlipX(this.direction === -1);
  }

  handleSentry(time) {
    const player = this.scene.player;
    if (!player) return;

    const distY = Math.abs(player.y - this.y);
    const distX = Math.abs(player.x - this.x);

    // Flip when player is to the left of the soldier
    this.setFlipX(player.x < this.x);

    if (
      distY < 100 &&
      distX < 600 &&
      time > this.lastShotTime + this.shootInterval
    ) {
      this.shoot();
      this.lastShotTime = time;
    }
  }

  shoot() {
    this.play("soldier-shoot", true);
    this.scene.time.delayedCall(1000, () => {
      if (this.active && this.aiType === "patrol") this.play("soldier-walk");
    });
    this.scene.events.emit("soldier-shot", this);
  }
}