import { Physics, Input } from "phaser";
import { playSFX } from "../SoundEffects";
import { TouchControls } from "../input/TouchControls";

export class Player extends Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player", "ned_smasher 0.aseprite");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setGravityY(1000);

    // =========================
    // JUMP / COYOTE
    // =========================
    this.lastJumpTime = 0;
    this.jumpCooldown = 400;
    this.coyoteTime = 120;
    this.lastGroundedTime = 0;

    // =========================
    // BODY
    // =========================
    this.setBodySize(64, 160);
    this.setOffset(32, 32);

    // =========================
    // ATTACK HITBOX
    // =========================
    this.attackHitbox = scene.add.rectangle(0, 0, 40, 120, 0xffffff, 0);
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = false;

    // =========================
    // KEYBOARD
    // =========================
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasdKeys = scene.input.keyboard.addKeys({
      W: Input.Keyboard.KeyCodes.W,
      A: Input.Keyboard.KeyCodes.A,
      S: Input.Keyboard.KeyCodes.S,
      D: Input.Keyboard.KeyCodes.D,
    });
    this.spaceKey = scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);

    // =========================
    // GAMEPAD BUTTON DEBOUNCE FLAG
    // =========================
    // Track if the smash button was pressed in the previous frame 
    // to mimic Phaser's Keyboard.JustDown functionality
    this.padSmashPressedLastFrame = false;

    // =========================
    // TOUCH CONTROLS
    // =========================
    this.touch = new TouchControls(scene, this);

    // =========================
    // STATE
    // =========================
    this.isSmashing = false;

    // =========================
    // ANIMATION
    // =========================
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
  // JUMP
  // =========================
  attemptJump() {
    const now = this.scene.time.now;
    const canJump = now < this.lastGroundedTime + this.coyoteTime;

    if (canJump && now > this.lastJumpTime + this.jumpCooldown) {
      this.setVelocityY(-1150);

      // horizontal boost from swipe momentum
      if (this.touch.touchMovementDirection !== 0) {
        const boost = this.touch.touchMovementDirection * 120;
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
    this.touch.update();

    // Track grounded time for coyote jump
    if (this.body.blocked.down) {
      this.lastGroundedTime = now;
    }

    // Safely look for an active, connected gamepad
    const gamepad = this.scene.input.gamepad ? this.scene.input.gamepad.pad1 : null;

    // =========================
    // INPUT BOOLEANS (KEYBOARD & TOUCH)
    // =========================
    let moveLeft = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    let moveRight = this.cursors.right.isDown || this.wasdKeys.D.isDown;
    
    // Keyboard Jump (Up / W / S)
    let jumpRequested = this.cursors.up.isDown || this.wasdKeys.W.isDown || this.wasdKeys.S.isDown;
    
    // Keyboard Attack (Spacebar)
    let smashRequested = Input.Keyboard.JustDown(this.spaceKey);

    const touchLeft = this.touch.touchMovementDirection === -1;
    const touchRight = this.touch.touchMovementDirection === 1;

    // =========================
    // OVERLAY GAMEPAD INPUTS (NES 8-BIT STYLE)
    // =========================
    if (gamepad) {
      // D-Pad Left / Right (Supports standard D-pad and analog stick overrides)
      if (gamepad.left || gamepad.leftStick.x < -0.3) moveLeft = true;
      if (gamepad.right || gamepad.leftStick.x > 0.3) moveRight = true;

      // Classic Nes Layout: Button A is JUMP
      if (gamepad.A) {
        jumpRequested = true;
      }

      // Classic Nes Layout: Button B is ATTACK / SMASH
      // Track 'JustDown' state so holding the button down doesn't spam smash attacks
      if (gamepad.B && !this.padSmashPressedLastFrame) {
        smashRequested = true;
      }
      this.padSmashPressedLastFrame = gamepad.B;
    } else {
      this.padSmashPressedLastFrame = false;
    }

    // =========================
    // MOVEMENT EXECUTION
    // =========================
    if (moveLeft || touchLeft) {
      this.setVelocityX(-240);
      this.setFlipX(false);
    } else if (moveRight || touchRight) {
      this.setVelocityX(240);
      this.setFlipX(true);
    } else {
      this.setVelocityX(0);
    }

    // =========================
    // JUMP EXECUTION
    // =========================
    if (
      jumpRequested &&
      now < this.lastGroundedTime + this.coyoteTime &&
      now > this.lastJumpTime + this.jumpCooldown
    ) {
      this.setVelocityY(-1150);
      playSFX("jump");
      this.lastJumpTime = now;
    }

    // =========================
    // SMASH EXECUTION
    // =========================
    if (smashRequested) {
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
