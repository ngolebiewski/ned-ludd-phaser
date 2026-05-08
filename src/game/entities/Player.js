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

    // ✅ COYOTE TIME
    this.coyoteTime = 120;
    this.lastGroundedTime = 0;

    // ✅ TOUCH MOMENTUM WINDOW
    this.touchMomentumUntil = 0;

    // Body
    this.setBodySize(64, 160);
    this.setOffset(32, 32);

    // Attack hitbox
    this.attackHitbox = scene.add.rectangle(0, 0, 40, 120, 0xffffff, 0);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = false;

    // Keyboard
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasdKeys = scene.input.keyboard.addKeys({
      W: Input.Keyboard.KeyCodes.W,
      A: Input.Keyboard.KeyCodes.A,
      S: Input.Keyboard.KeyCodes.S,
      D: Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey = scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);

    // Touch
    this.touchMovementDirection = 0;
    this.touchPointerActive = false;
    this.touchPointerId = null;
    this.isSmashing = false;

    scene.input.on("pointerdown", (p) => this.onTouchStart(p));
    scene.input.on("pointermove", (p) => this.onTouchMove(p));
    scene.input.on("pointerup", (p) => this.onTouchEnd(p));

    // Animation
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

  // =========================
  // TOUCH
  // =========================

  onTouchStart(pointer) {
    if (!this.touchPointerActive) {
      this.touchPointerActive = true;
      this.touchPointerId = pointer.id;

      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
    }
  }

  onTouchMove(pointer) {
    if (pointer.id !== this.touchPointerId) return;

    const mid = this.scene.scale.width / 2;
    this.touchMovementDirection = pointer.x < mid ? -1 : 1;
  }

  onTouchEnd(pointer) {
    if (pointer.id !== this.touchPointerId) return;

    this.touchPointerActive = false;
    this.touchPointerId = null;

    const deltaY = this.swipeStartY - pointer.y;
    const deltaX = pointer.x - this.swipeStartX;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const now = this.scene.time.now;

    // ✅ JUMP
    if (deltaY > 80) {
      if (Math.abs(deltaX) > 30) {
        this.touchMovementDirection = deltaX > 0 ? 1 : -1;

        // ✅ short momentum after swipe
        this.touchMomentumUntil = now + 150;
      }

      this.attemptJump();
    }

    // ✅ TAP = SMASH
    else if (distance < 40) {
      this.touchMovementDirection = 0;
      this.smash();
    }

    // ✅ OTHERWISE STOP
    else {
      this.touchMovementDirection = 0;
    }
  }

  // =========================
  // JUMP (WITH COYOTE TIME)
  // =========================

  attemptJump() {
    const now = this.scene.time.now;

    const canJump = now < this.lastGroundedTime + this.coyoteTime;

    if (canJump && now > this.lastJumpTime + this.jumpCooldown) {
      this.setVelocityY(-1150);

      // ✅ ADD THIS: horizontal boost
      if (this.touchMovementDirection !== 0) {
        const boost = this.touchMovementDirection * 120;

        // add to current velocity instead of replacing it
        this.setVelocityX(this.body.velocity.x + boost);
      }

      playSFX("jump");
      this.lastJumpTime = now;
    }
  }

  // =========================
  // UPDATE
  // =========================

  update() {
    if (this.isSmashing) return;

    const now = this.scene.time.now;

    // ✅ clear leftover momentum after short window
    if (
      !this.touchPointerActive &&
      this.touchMomentumUntil &&
      now > this.touchMomentumUntil
    ) {
      this.touchMovementDirection = 0;
    }

    // Track last grounded time (for coyote time)
    if (this.body.blocked.down) {
      this.lastGroundedTime = now;
    }

    const moveLeft = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const moveRight = this.cursors.right.isDown || this.wasdKeys.D.isDown;

    const touchLeft = this.touchMovementDirection === -1;
    const touchRight = this.touchMovementDirection === 1;

    // ✅ Continuous movement (THIS fixes mobile)
    if (moveLeft || touchLeft) {
      this.setVelocityX(-240);
      this.setFlipX(false);
    } else if (moveRight || touchRight) {
      this.setVelocityX(240);
      this.setFlipX(true);
    } else {
      this.setVelocityX(0);
    }

    // Keyboard jump
    if (
      (this.cursors.up.isDown ||
        this.wasdKeys.W.isDown ||
        this.wasdKeys.S.isDown) &&
      now < this.lastGroundedTime + this.coyoteTime &&
      now > this.lastJumpTime + this.jumpCooldown
    ) {
      this.setVelocityY(-1150);
      playSFX("jump");
      this.lastJumpTime = now;
    }

    if (Input.Keyboard.JustDown(this.spaceKey)) {
      this.smash();
    }
  }

  // =========================
  // SMASH
  // =========================

  smash() {
    this.isSmashing = true;
    playSFX("hit");
    this.setVelocityX(0);
    this.play("smash");

    const reach = 50;
    const hx = this.flipX ? this.x + reach : this.x - reach;
    const hy = this.y - 10;

    this.attackHitbox.setPosition(hx, hy);
    this.attackHitbox.body.enable = true;

    this.scene.time.delayedCall(150, () => {
      if (this.scene.checkSmashHit) {
        this.scene.checkSmashHit(this.attackHitbox);
      }
    });

    this.once("animationcomplete", () => {
      this.isSmashing = false;
      this.attackHitbox.body.enable = false;
      this.setFrame("ned_smasher 0.aseprite");
    });
  }
}
