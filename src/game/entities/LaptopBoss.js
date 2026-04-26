import { Physics, Math as PhaserMath, Geom } from "phaser";

export class LaptopBoss extends Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "laptop");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = 10;
    this.isActive = false; 
    this.isBeingHit = false; 
    this.lastActionTime = 0;
    
    this.setCollideWorldBounds(true);
    this.body.setGravityY(1000);
    this.setDepth(20);
    this.play("laptop-ai");
    
    // Anchor to feet to prevent getting stuck in floors during scale-up
    this.setOrigin(0.5, 1);
  }

  static createAnimations(scene) {
    const frames = scene.anims.generateFrameNames("laptop", {
      prefix: "laptop ", suffix: ".aseprite", start: 0, end: 6
    });
    
    if (!scene.anims.exists("laptop-blink")) {
      scene.anims.create({ key: "laptop-blink", frames: [frames[0], frames[1]], frameRate: 4, repeat: -1 });
      scene.anims.create({ key: "laptop-ai", frames: [frames[6]], frameRate: 1 });
      scene.anims.create({ key: "laptop-eyes", frames: [frames[3]], frameRate: 1 });
      scene.anims.create({ key: "laptop-close", frames: [frames[4], frames[5]], frameRate: 8, yoyo: true });
    }
  }

  update(time) {
    if (!this.isActive || this.hp <= 0) return;

    // TAME FREQUENCY: 1.8 seconds between actions
    if (time > this.lastActionTime + 1800) {
      // 50/50 split between jumping and lasering
      Math.random() < 0.5 ? this.jump() : this.fireLasers();
      this.lastActionTime = time;
    }
  }

  jump() {
    const jumpX = (this.scene.player.x < this.x) ? -400 : 400;
    this.setVelocity(jumpX, -600);
    this.play("laptop-blink");
    this.scene.time.delayedCall(800, () => {
      if (this.active && this.hp > 0) this.play("laptop-ai");
    });
  }

  fireLasers() {
    this.play("laptop-eyes");
    this.setVelocityX(0);

    this.scene.time.delayedCall(600, () => {
      if (!this.active || this.hp <= 0) return;

      const beam = this.scene.add.line(0, 0, this.x, this.y - (this.displayHeight * 0.5), this.scene.player.x, this.scene.player.y, 0x00ff00)
        .setOrigin(0).setLineWidth(4).setDepth(25);
      
      const ray = new Geom.Line(this.x, this.y - (this.displayHeight * 0.5), this.scene.player.x, this.scene.player.y);
      const platforms = this.scene.platforms.getChildren();
      let blocked = false;

      for (const p of platforms) {
        if (Geom.Intersects.LineToRectangle(ray, p.getBounds())) {
          blocked = true;
          break;
        }
      }

      this.scene.tweens.add({
        targets: beam,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (!blocked) {
            const dist = PhaserMath.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
            // Ned gets hit if path is clear and he's within range
            if (dist < 600) { 
              this.scene.handlePlayerHit(true); 
            }
          }
          beam.destroy();
          if (this.active) this.play("laptop-ai");
        }
      });
    });
  }

  takeDamage() {
    if (!this.isActive || this.isBeingHit || this.hp <= 0) return;
    
    this.isBeingHit = true;
    this.hp--;
    this.setTint(0xff0000);
    
    if (this.scene.particles) {
      this.scene.particles.emitParticleAt(this.x, this.y, 10);
    }

    this.scene.time.delayedCall(500, () => {
      if (this.active) {
        this.clearTint();
        this.isBeingHit = false;
      }
    });

    // PHASE 2 TRANSITION (Big Laptop)
    if (this.hp === 5) {
      this.scene.cameras.main.shake(500, 0.02);
      
      // Stop physics briefly to prevent "pop-out" glitches
      this.body.setEnable(false);

      this.scene.tweens.add({ 
        targets: this, 
        scale: 5, 
        duration: 1200, 
        ease: "Bounce.easeOut",
        onUpdate: () => {
          // Adjust Y while scaling so feet stay on the floor
          this.body.updateFromGameObject();
        },
        onComplete: () => {
          this.body.setEnable(true);
        }
      });
    }

    if (this.hp <= 0) {
      this.play("laptop-close");
      this.body.setEnable(false);
      this.scene.tweens.add({
        targets: this, alpha: 0, angle: 720, duration: 2000,
        onComplete: () => this.destroy()
      });
    }
  }
}