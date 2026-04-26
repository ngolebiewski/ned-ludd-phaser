import { Scene } from "phaser";

export class Title extends Scene {
  constructor() {
    super("Title");
  }

  TILES = {
    BG_GRID: 13,
    TITLE_ART: [
      [81, 82, 83, 84, 0],
      [90, 91, 92, 93, 94],
    ],
    ENGLAND_ART: [
      [7, 8],
      [16, 17],
      [25, 26],
    ],
  };

  create() {
    const { width, height } = this.scale;
    this.input.keyboard.on("keydown-NINE", () => {
      this.scene.start("BossBattle");
    });

    // 1. Tiled Background
    this.bg = this.add.tileSprite(
      0,
      0,
      width,
      height,
      "factory",
      this.TILES.BG_GRID,
    );
    this.bg.setOrigin(0).setAlpha(0.9).setTint(0x666666);

    // 2. Containers for easy fading
    this.titleGroup = this.add.container(0, 0);
    this.englandGroup = this.add.container(0, 0).setAlpha(0);

    // 3. Spawn Title Art into its container
    this.spawnArt(this.titleGroup, this.TILES.TITLE_ART, width / 2, height / 2);

    // 4. Spawn England Art into its container (invisible for now)
    this.spawnArt(
      this.englandGroup,
      this.TILES.ENGLAND_ART,
      width / 2,
      height / 2,
    );

    // 5. Text
    this.infoText = this.add
      .text(
        width / 2,
        height - 100,
        "Nottingham, England, 1812... Space to START",
        {
          fontFamily: '"DepartureMono"',
          fontSize: "32px",
          fill: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(100);

    // 6. Transition Logic
    this.input.keyboard.once("keydown-SPACE", () => this.startTransition());
  }

  startTransition() {
    // Phase 1: Hide Title Art and Text
    this.tweens.add({
      targets: [this.titleGroup, this.infoText],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        // Phase 2: Show England Art
        this.tweens.add({
          targets: this.englandGroup,
          alpha: 1,
          duration: 800,
          hold: 500, // Keep it on screen for 1 second
          onComplete: () => {
            // Phase 3: Final Fade Out
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once("camerafadeoutcomplete", () => {
              this.scene.start("MainGame");
            });
          },
        });
      },
    });
  }

  // Generic art spawner that works for any 2D tile array
  spawnArt(container, tileMatrix, centerX, centerY) {
    const scale = 2;
    const tileSize = 64 * scale;

    tileMatrix.forEach((row, rowIndex) => {
      const rowWidth = row.length * tileSize;
      const startX = centerX - rowWidth / 2;
      const startY = centerY - (tileMatrix.length * tileSize) / 2;

      row.forEach((frame, colIndex) => {
        const img = this.add
          .image(
            startX + colIndex * tileSize,
            startY + rowIndex * tileSize,
            "factory",
            frame,
          )
          .setOrigin(0)
          .setScale(scale);

        container.add(img);
      });
    });
  }
}
