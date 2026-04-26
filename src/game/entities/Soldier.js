import { Physics, Math as PhaserMath } from "phaser";

export class Soldier extends Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'patrol') {
        super(scene, x, y, 'soldier'); // Assumes 'soldier' key for the sprite
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.aiType = type; // 'patrol' or 'sentry'
        this.setOrigin(0.5, 1);
        this.setCollideWorldBounds(true);
        this.setDepth(9);
        
        // AI State
        this.patrolSpeed = 100;
        this.direction = 1; // 1 for right, -1 for left
        this.lastShotTime = 0;
        this.shootInterval = 4000; // 4 seconds

        if (this.aiType === 'patrol') {
            this.play('soldier-walk');
            this.setVelocityX(this.patrolSpeed);
        } else {
            this.play('soldier-shoot'); // Sentry stays in shoot pose or idle
            this.setImmovable(true);
            this.body.setAllowGravity(true);
        }
    }

    update(time) {
        if (!this.active) return;

        if (this.aiType === 'patrol') {
            this.handlePatrol();
        } else if (this.aiType === 'sentry') {
            this.handleSentry(time);
        }
    }

    handlePatrol() {
        // Check for edges of platforms or walls
        if (this.body.blocked.right || this.body.blocked.left) {
            this.flipDirection();
        }
        
        // Optional: Add a "pit check" here if you want them to turn before falling
        this.setVelocityX(this.patrolSpeed * this.direction);
        this.setFlipX(this.direction === -1);
    }

    handleSentry(time) {
        // Shoot every 4 seconds if player is on the same Y level
        const player = this.scene.player;
        const distY = Math.abs(player.y - this.y);

        if (distY < 64 && time > this.lastShotTime + this.shootInterval) {
            this.shoot();
            this.lastShotTime = time;
        }
    }

    shoot() {
        // Logic for spawning a bullet or just triggering a muzzle flash/hitbox
        this.play('soldier-shoot', true);
        this.scene.time.delayedCall(500, () => {
            if(this.active && this.aiType === 'patrol') this.play('soldier-walk');
        });
        
        // Emit a simple "bullet" event for the scene to handle
        this.scene.events.emit('soldier-shot', this);
    }

    flipDirection() {
        this.direction *= -1;
    }
}