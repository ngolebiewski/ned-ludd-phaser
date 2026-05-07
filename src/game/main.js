import { AUTO, Scale, Game } from "phaser";

import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { MainGame} from "./scenes/MainGame";
import { BossBattle } from "./scenes/BossBattle";

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: "game-container",
    backgroundColor: "#222",

    pixelArt: true, 
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false // Set to true if you want to see hitboxes
        }
    },
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        pixelArt: true,
    },

    scene: [Boot, Title, MainGame, BossBattle], 
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
};

export default StartGame;