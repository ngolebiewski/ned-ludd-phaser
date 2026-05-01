import { Physics, Input } from "phaser";
import { playSFX } from "../SoundEffects";

export class Player extends Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player", "ned_smasher 0.aseprite");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setGravityY(1000);
    this.lastJumpTime = 0;
    this.jumpCooldown = 400;

    // Standard player body
    this.setBodySize(64, 160);
    this.setOffset(32, 32);

    // --- NEW: THE INVISIBLE ATTACK HITBOX ---
    // Create a tiny invisible sprite for the attack zone
    this.attackHitbox = scene.add.rectangle(0, 0, 40, 120, 0xffffff, 0);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = false; // Keep it off until we smash
    // -----------------------------------------

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
    this.isSmashing = false;

    if (!scene.anims.exists("smash")) {
      scene.anims.create({
        key: "smash",
        frames: scene.anims.generateFrameNames("player", {
          prefix: "ned_smasher ",
          suffix: ".aseprite",
          start: 0,
          end: 2,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }
  }

  update() {
    if (this.isSmashing) return;

    if (this.cursors.left.isDown) {
      this.setVelocityX(-240);
      this.setFlipX(false);
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(240);
      this.setFlipX(true);
    } else {
      this.setVelocityX(0);
    }

    const currentTime = this.scene.time.now;
    if (
      (this.cursors.up.isDown || this.cursors.shift.isDown) &&
      this.body.blocked.down &&
      currentTime > this.lastJumpTime + this.jumpCooldown
    ) {
      this.setVelocityY(-1150);
      playSFX("jump");
      this.lastJumpTime = currentTime;
    }

    if (Input.Keyboard.JustDown(this.spaceKey)) {
      this.smash();
    }
  }

  smash() {
    this.isSmashing = true;
    playSFX("hit");
    this.setVelocityX(0);
    this.play("smash");

    // Position the attack hitbox in front of the player
    // reach of 40-50px usually solves the "moving same direction" issue
    const reach = 50; 
    const hx = this.flipX ? this.x + reach : this.x - reach;
    const hy = this.y - 10; // Positioned around chest/arm height

    this.attackHitbox.setPosition(hx, hy);
    this.attackHitbox.body.enable = true;

    // Trigger the actual overlap check in MainGame using our hitbox
    this.scene.time.delayedCall(150, () => {
      // We pass the hitbox to the MainGame's detection logic
      if (this.scene.checkSmashHit) {
        // Update checkSmashHit to use the hitbox instead of 'this'
        this.scene.checkSmashHit(this.attackHitbox);
      }
    });

    this.once("animationcomplete", () => {
      this.isSmashing = false;
      this.attackHitbox.body.enable = false; // Disable the hitbox
      this.setFrame("ned_smasher 0.aseprite");
    });
  }
}