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
    
    // Hitbox dimensions
    this.hitboxWidth = 50;
    this.hitboxHeight = 110;
    this.spriteWidth = 100; // Aseprite source width
    this.spriteHeight = 128;
    this.verticalOffset = 18; // (128 - 110) / 2
    
    // Set the initial hitbox
    this.body.setSize(this.hitboxWidth, this.hitboxHeight);
    
    // Physics Tuning
    this.body.setGravityY(1000); 
    this.patrolSpeed = 100;
    this.direction = 1; // 1 is Right, -1 is Left
    this.lastShotTime = 0;
    this.shootInterval = 4000;
    
    // Initialize hitbox for right-facing
    this.updateHitboxOffset();
    
    if (this.aiType === "patrol") {
      this.play("soldier-walk");
    } else {
      this.play("soldier-shoot");
      this.setImmovable(true);
    }
  }

  updateHitboxOffset() {
    // Horizontal centering: (100 - 50) / 2 = 25px from each side
    // But we need to account for direction when flipped
    let horizontalOffset;
    
    if (this.direction === 1) {
      // Facing RIGHT: offset from left side = 15px (to leave 35px on right for gun)
      horizontalOffset = 15;
    } else {
      // Facing LEFT: mirror the offset
      // When flipped, we want 15px from the RIGHT side of the sprite
      // Which means offset from left = 100 - 15 - 50 = 35px
      horizontalOffset = 35;
    }
    
    this.body.setOffset(horizontalOffset, this.verticalOffset);
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
      this.updateHitboxOffset();
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
        this.updateHitboxOffset();
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
    
    // Update direction and hitbox when flipping
    const shouldFaceLeft = player.x < this.x;
    const newDirection = shouldFaceLeft ? -1 : 1;
    if (newDirection !== this.direction) {
      this.direction = newDirection;
      this.updateHitboxOffset();
    }
    
    this.setFlipX(shouldFaceLeft);
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