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

    // --- INVISIBLE ATTACK HITBOX ---
    // Create a tiny invisible sprite for the attack zone
    this.attackHitbox = scene.add.rectangle(0, 0, 40, 120, 0xffffff, 0);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = false;
    // ---------------------------------

    // Keyboard inputs: arrows + WASD + space
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasdKeys = scene.input.keyboard.addKeys({
      W: Input.Keyboard.KeyCodes.W,
      A: Input.Keyboard.KeyCodes.A,
      S: Input.Keyboard.KeyCodes.S,
      D: Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey = scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);

    // Touch control state
    this.touchMovementDirection = 0; // -1 (left), 0 (none), 1 (right)
    this.touchPointerActive = false;
    this.touchPointerId = null; // Track which pointer is for movement
    this.isSmashing = false;

    // Set up touch listeners
    scene.input.on("pointerdown", (pointer) => this.onTouchStart(pointer));
    scene.input.on("pointermove", (pointer) => this.onTouchMove(pointer));
    scene.input.on("pointerup", (pointer) => this.onTouchEnd(pointer));

    // Animation setup
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

  onTouchStart(pointer) {
    // Record initial touch position for movement/swipe detection
    if (!this.touchPointerActive) {
      this.touchPointerActive = true;
      this.touchPointerId = pointer.id;
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.touchStartTime = this.scene.time.now;
    }
  }

  onTouchMove(pointer) {
    // Only process if this is our movement pointer
    if (pointer.id !== this.touchPointerId || !this.touchPointerActive) return;

    // Determine movement direction based on which half of screen is held
    const screenCenterX = this.scene.scale.width / 2;
    if (pointer.x < screenCenterX) {
      this.touchMovementDirection = -1; // Left side = move left
    } else {
      this.touchMovementDirection = 1; // Right side = move right
    }
  }

  onTouchEnd(pointer) {
    // Only process if this is our movement pointer
    if (pointer.id !== this.touchPointerId) return;

    this.touchPointerActive = false;
    this.touchMovementDirection = 0;
    this.touchPointerId = null;

    const deltaY = this.swipeStartY - pointer.y;
    const deltaX = Math.abs(pointer.x - this.swipeStartX);
    const touchDuration = this.scene.time.now - this.touchStartTime;

    // Swipe up: vertical distance > 40px and not too horizontal, quick movement
    if (deltaY > 40 && deltaX < 50 && touchDuration < 300) {
      this.attemptJump();
    }
    // Tap: minimal movement, quick tap = hit
    else if (deltaY < 20 && deltaX < 20 && touchDuration < 200) {
      this.smash();
    }
  }

  attemptJump() {
    // Jump if grounded and cooldown has passed
    const currentTime = this.scene.time.now;
    if (this.body.blocked.down && currentTime > this.lastJumpTime + this.jumpCooldown) {
      this.setVelocityY(-1150);
      playSFX("jump");
      this.lastJumpTime = currentTime;
    }
  }

  update() {
    // Don't process input while smashing
    if (this.isSmashing) return;

    // Keyboard input (arrows + WASD)
    const moveLeft = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const moveRight = this.cursors.right.isDown || this.wasdKeys.D.isDown;

    // Touch input
    const touchMoveLeft = this.touchMovementDirection === -1;
    const touchMoveRight = this.touchMovementDirection === 1;

    // Combined movement: keyboard OR touch
    if (moveLeft || touchMoveLeft) {
      this.setVelocityX(-240);
      this.setFlipX(false);
    } else if (moveRight || touchMoveRight) {
      this.setVelocityX(240);
      this.setFlipX(true);
    } else {
      this.setVelocityX(0);
    }

    // Jump: up arrow or W or S (keyboard only, touch uses swipe)
    const currentTime = this.scene.time.now;
    if (
      (this.cursors.up.isDown || this.wasdKeys.W.isDown || this.wasdKeys.S.isDown) &&
      this.body.blocked.down &&
      currentTime > this.lastJumpTime + this.jumpCooldown
    ) {
      this.setVelocityY(-1150);
      playSFX("jump");
      this.lastJumpTime = currentTime;
    }

    // Hit/smash: space bar (keyboard only, touch uses tap)
    if (Input.Keyboard.JustDown(this.spaceKey)) {
      this.smash();
    }
  }

  smash() {
    // Start smash animation and enable attack hitbox
    this.isSmashing = true;
    playSFX("hit");
    this.setVelocityX(0);
    this.play("smash");

    // Position the attack hitbox in front of the player
    const reach = 50;
    const hx = this.flipX ? this.x + reach : this.x - reach;
    const hy = this.y - 10; // Positioned around chest/arm height
    this.attackHitbox.setPosition(hx, hy);
    this.attackHitbox.body.enable = true;

    // Trigger hit detection midway through animation
    this.scene.time.delayedCall(150, () => {
      if (this.scene.checkSmashHit) {
        this.scene.checkSmashHit(this.attackHitbox);
      }
    });

    // Reset after animation completes
    this.once("animationcomplete", () => {
      this.isSmashing = false;
      this.attackHitbox.body.enable = false;
      this.setFrame("ned_smasher 0.aseprite");
    });
  }
}