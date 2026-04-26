import { AUTO, Scale, Game } from "phaser";

import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { Level} from "./scenes/Level";

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: "game-container",
    backgroundColor: "#222",

    pixelArt: true, // 🔥 important for your art

    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        pixelArt: true,
    },

    scene: [Boot, Title, Level], 
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
};

export default StartGame;