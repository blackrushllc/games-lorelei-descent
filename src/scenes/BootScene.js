import Phaser from 'phaser';
import { SpriteAnimationRegistry } from '../systems/SpriteAnimationRegistry';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load Music Tracks
        this.load.audio('synth', 'assets/audio/music/below-gamorrah-synth.mp3');
        this.load.audio('cathedral', 'assets/audio/music/below-gamorrah-cathedral.mp3');
        this.load.audio('studio', 'assets/audio/music/below-gamorrah-studio.mp3');

        // Loading indicator
        const { width, height } = this.scale;
        const loadingText = this.add.text(width / 2, height / 2, 'Loading Audio...', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('complete', () => {
            loadingText.destroy();
        });

        // Load Sprite Animations
        this.registry.set('spriteAnimationRegistry', new SpriteAnimationRegistry(this));
    }

    async create() {
        this.createProjectileTextures();
        
        const spriteRegistry = this.registry.get('spriteAnimationRegistry');
        try {
            await spriteRegistry.load('assets/sprites/manifest.json');
            console.log('BootScene: Audio and sprite assets loaded.');
        } catch (err) {
            console.error('BootScene: Failed to load sprite assets:', err);
        }

        console.log('BootScene: Starting TitleScene...');
        this.scene.start('TitleScene');
    }

    createProjectileTextures() {
        // 1. Energy Bolt Texture
        // 8x24 cyan rectangle with glow
        const energyG = this.make.graphics({ x: 0, y: 0, add: false });
        energyG.fillStyle(0x00ffff, 0.5);
        energyG.fillRoundedRect(0, 0, 12, 28, 6);
        energyG.fillStyle(0xffffff, 1);
        energyG.fillRoundedRect(3, 4, 6, 20, 3);
        energyG.generateTexture('energy_bolt', 12, 28);

        // 2. Axe Texture
        // Simple procedural axe shape (32x32)
        const axeG = this.make.graphics({ x: 0, y: 0, add: false });
        axeG.lineStyle(2, 0x888888, 1);
        axeG.fillStyle(0xaaaaaa, 1);
        
        // Handle
        axeG.fillRect(14, 0, 4, 32);
        
        // Blades
        axeG.beginPath();
        axeG.moveTo(14, 5);
        axeG.lineTo(4, 0);
        axeG.lineTo(4, 15);
        axeG.lineTo(14, 10);
        axeG.closePath();
        axeG.fillPath();
        axeG.strokePath();

        axeG.beginPath();
        axeG.moveTo(18, 5);
        axeG.lineTo(28, 0);
        axeG.lineTo(28, 15);
        axeG.lineTo(18, 10);
        axeG.closePath();
        axeG.fillPath();
        axeG.strokePath();
        
        axeG.generateTexture('axe', 32, 32);

        // 3. Muzzle Flash (small white circle)
        const flashG = this.make.graphics({ x: 0, y: 0, add: false });
        flashG.fillStyle(0xffffff, 1);
        flashG.fillCircle(8, 8, 8);
        flashG.generateTexture('muzzle_flash', 16, 16);
    }
}
