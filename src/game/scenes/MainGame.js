import { Scene } from 'phaser';
import { Player } from '../entities/Player';

export class MainGame extends Scene {
    constructor() {
        super('MainGame');
    }

    create() {
        const { width, height } = this.scale;
        const levelWidth = 3000; 

        // 1. RANDOMIZED BACKGROUND (The chaotic 1812 factory floor)
        const angles = [0, 90, 180, 270];
        for (let x = 0; x < levelWidth; x += 64) {
            for (let y = 0; y < height; y += 64) {
                const bgTile = this.add.image(x, y, 'factory', 13).setOrigin(0);
                bgTile.setAlpha(0.2).setTint(0x333333);
                bgTile.setAngle(angles[Math.floor(Math.random() * angles.length)]);
            }
        }

        // 2. PLATFORMS
        this.platforms = this.physics.add.staticGroup();
        
        // Simple floor
        for (let x = 0; x < levelWidth; x += 64) {
            // Mix tile 18 and 19 for a worn-out brick look
            const frame = Math.random() > 0.5 ? 18 : 19;
            this.platforms.create(x, height - 32, 'factory', frame).refreshBody();
        }

        // 3. PLAYER (Nedd Ludd)
        this.player = new Player(this, 100, height - 250);

        // 4. CAMERA & WORLD
        this.physics.add.collider(this.player, this.platforms);
        this.cameras.main.setBounds(0, 0, levelWidth, height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.physics.world.setBounds(0, 0, levelWidth, height);
    }

    update() {
        if (this.player) {
            this.player.update();
        }
    }

    // Call this from Player.js during the smash animation
    checkSmashHit() {
        // We'll add machine overlap logic here next!
        console.log("SMASH!");
    }
}