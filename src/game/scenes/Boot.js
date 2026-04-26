import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // 🧱 ENVIRONMENT
    this.load.spritesheet("factory", "assets/factory_set.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    // 🧍 PLAYER
    this.load.atlas(
      "player",
      "assets/ned_smasher.png",
      "assets/ned_smasher.json",
    );

    // 🤖 ENEMY
    this.load.atlas("soldier", "assets/soldier.png", "assets/soldier.json");

    // 💻 SUPER VILLAIN
    this.load.atlas("laptop", "assets/laptop.png", "assets/laptop.json");
  }

  create() {
    //  debug (DO THIS ONCE)
    console.log("PLAYER FRAMES:", this.textures.get("player").getFrameNames());
    console.log(
      "SOLDIER FRAMES:",
      this.textures.get("soldier").getFrameNames(),
    );
    console.log("LAPTOP FRAMES:", this.textures.get("laptop").getFrameNames());
    console.log("---------------------------");
    console.log(
      "FACTORY FRAMES:",
      this.textures.get("factory").getFrameNames(),
    );

    this.scene.start("Title");
  }

  // A quick helper to "stamp" your window onto the background
  addWindow(x, y) {
    const windowTiles = [
      [5, 6],
      [14, 15],
      [23, 24],
      [32, 33],
      [41, 42],
      [50, 51],
    ];

    windowTiles.forEach((row, rowIndex) => {
      row.forEach((frame, colIndex) => {
        this.add.image(x + colIndex * 64, y + rowIndex * 64, "factory", frame);
      });
    });
  }
}
