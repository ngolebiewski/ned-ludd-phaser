// Constants.js

export const TILES = {
    BRICK: 19,
    BRICK_WORN: 18,
    BG_TILE: 13,
    SMOKE: 40,
    RUBBLE: [34, 35],
    WINDOW: [
        [5, 6], [14, 15], [23, 24], [32, 33], [41, 42], [50, 51]
    ],
    JENNY: [
        [57, 58, 59],
        [66, 67, 68]
    ],
    STOCKING: [
        [43, 0],
        [52, 53],
        [61, 62],
        [70, 71]
    ]
};

/**
 * Spawns the 2x6 Window background art
 */
export const spawnWindow = (scene, x, y) => {
    TILES.WINDOW.forEach((row, rowIndex) => {
        row.forEach((frame, colIndex) => {
            scene.add.image(x + (colIndex * 64), y + (rowIndex * 64), 'factory', frame).setOrigin(0);
        });
    });
};

/**
 * Spawns a machine into a physics group
 */
export const spawnMachine = (scene, x, y, layout, group) => {
    layout.forEach((row, rowIndex) => {
        row.forEach((frame, colIndex) => {
            if (frame === 0) return; 
            const part = group.create(x + (colIndex * 64), y + (rowIndex * 64), 'factory', frame).setOrigin(0);
            part.health = 3; 
            part.isMachine = true; 
        });
    });
};

/**
 * @param {Phaser.Scene} scene 
 * @param {number} x 
 * @param {number} y 
 * @param {number} frame - The gear tile ID
 * @param {number} scale - 1, 2, 3, or 4
 * @param {number} speed - Rotation speed
 * @param {number} dir - 1 for clockwise, -1 for counter
 */
export const spawnGear = (scene, x, y, frame, scale = 1, speed = 1, dir = 1) => {
    const gear = scene.add.image(x, y, 'factory', frame);
    gear.setOrigin(0.5);
    gear.setScale(scale);
    
    const alphaMap = { 1: 0.9, 2: 0.7, 3: 0.5, 4: 0.3 };
    const tintMap = { 1: 0xffffff, 2: 0xaaaaaa, 3: 0x777777, 4: 0x444444 };
    
    gear.setAlpha(alphaMap[scale] || 0.5);
    gear.setTint(tintMap[scale] || 0x666666);
    gear.setDepth(-1 * scale); 

    scene.events.on('update', () => {
        gear.angle += (speed * dir);
    });

    return gear;
};

/**
 * Spawns a brick pyramid
 */
export const spawnPyramid = (scene, group, x, y, baseWidth = 5) => {
    let currentWidth = baseWidth;
    let currentY = y;
    
    while (currentWidth > 0) {
        const rowOffset = (baseWidth - currentWidth) * 32;
        for (let i = 0; i < currentWidth; i++) {
            const tileX = x + rowOffset + (i * 64);
            group.create(tileX, currentY, 'factory', 19).refreshBody();
        }
        currentWidth -= 2; 
        currentY -= 64;    
    }
};