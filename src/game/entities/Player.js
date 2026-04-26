import { Physics, Input } from 'phaser';

export class Player extends Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player', 'ned_smasher 0.aseprite');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(700); 
        
        // Match the 128x192 sprite size better
        this.setBodySize(64, 160); 
        this.setOffset(32, 32);

        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // Define the "Space" key specifically to avoid the "Phaser.Input" global error
        this.spaceKey = scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);
        
        this.isSmashing = false;

        // Ensure animations exist (Safe check if Boot didn't do it)
        if (!scene.anims.exists('smash')) {
            scene.anims.create({
                key: 'smash',
                frames: scene.anims.generateFrameNames('player', {
                    prefix: 'ned_smasher ',
                    suffix: '.aseprite',
                    start: 0,
                    end: 2
                }),
                frameRate: 12,
                repeat: 0
            });
        }
    }

    update() {
        if (this.isSmashing) return;

        // LEFT (Native)
        if (this.cursors.left.isDown) {
            this.setVelocityX(-240);
            this.setFlipX(false); 
        } 
        // RIGHT (Flipped)
        else if (this.cursors.right.isDown) {
            this.setVelocityX(240);
            this.setFlipX(true);  
        } 
        else {
            this.setVelocityX(0);
        }

        // Jump (Up or Shift)
        if ((this.cursors.up.isDown || this.cursors.shift.isDown) && this.body.blocked.down) {
            this.setVelocityY(-650);
        }

        // Smash (Using the spaceKey instance instead of the global Phaser call)
        if (Input.Keyboard.JustDown(this.spaceKey)) {
            this.smash();
        }
    }

    smash() {
        this.isSmashing = true;
        this.setVelocityX(0);
        this.play('smash');
        
        // Trigger the hit detection in MainGame
        this.scene.time.delayedCall(150, () => {
            if (this.scene.checkSmashHit) {
                this.scene.checkSmashHit(); 
            }
        });

        this.once('animationcomplete', () => {
            this.isSmashing = false;
            // No walk animation defined in your JSON tags yet (just a static frame),
            // so we stop the animation or go back to frame 0.
            this.setFrame('ned_smasher 0.aseprite');
        });
    }
}