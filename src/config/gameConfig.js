import Phaser from 'phaser';
import BootScene from '../scenes/BootScene.js';
import TitleScene from '../scenes/TitleScene.js';
import GameScene from '../scenes/GameScene.js';
import GameOverScene from '../scenes/GameOverScene.js';
import EndingScene from '../scenes/EndingScene.js';

/**
 * Logical resolution and scaling configuration.
 */
export const GAME_CONFIG = {
    width: 1280,
    height: 960,
    backgroundColor: '#10151f',
    parent: 'game-container',
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, TitleScene, GameScene, GameOverScene, EndingScene]
};
