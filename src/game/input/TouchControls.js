// TouchControls.js

export class TouchControls {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.touchMovementDirection = 0;
    this.touchPointerActive = false;
    this.touchPointerId = null;
    this.touchMomentumUntil = 0;

    scene.input.on("pointerdown", this.onTouchStart, this);
    scene.input.on("pointermove", this.onTouchMove, this);
    scene.input.on("pointerup", this.onTouchEnd, this);
  }

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

    if (deltaY > 80) {
      if (Math.abs(deltaX) > 30) {
        this.touchMovementDirection = deltaX > 0 ? 1 : -1;

        this.touchMomentumUntil = now + 150;
      }

      this.player.attemptJump();
    } else if (distance < 40) {
      this.touchMovementDirection = 0;
      this.player.smash();
    } else {
      this.touchMovementDirection = 0;
    }
  }

  update() {
    const now = this.scene.time.now;

    if (
      !this.touchPointerActive &&
      this.touchMomentumUntil &&
      now > this.touchMomentumUntil
    ) {
      this.touchMovementDirection = 0;
    }
  }
}
