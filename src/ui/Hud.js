import Phaser from 'phaser';

/**
 * Heads-up display for LORELEI: DESCENT.
 */
export default class Hud extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);

        const { width } = scene.game.config;

        // Background for HUD top area
        const bg = scene.add.graphics();
        bg.fillStyle(0x000000, 0.5);
        bg.fillRect(0, 0, width, 80);
        this.add(bg);

        // Shield Label and Bar
        this.add(scene.add.text(20, 15, 'SHIELD', { fontSize: '14px', fill: '#ffffff', fontFamily: 'Arial' }));
        
        this.shieldBar = scene.add.graphics();
        this.updateShieldBar(1, 1);
        this.add(this.shieldBar);

        // Score
        this.scoreText = scene.add.text(width - 20, 15, 'SCORE: 0', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(1, 0);
        this.add(this.scoreText);

        // Weapon Indicators
        this.weaponText = scene.add.text(20, 45, 'ENERGY: READY', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });
        this.add(this.weaponText);

        this.axeText = scene.add.text(200, 45, 'AXE: READY', {
            fontSize: '16px',
            fill: '#00ff00',
            fontFamily: 'Arial'
        });
        this.add(this.axeText);

        // Development Phase Label
        this.phaseLabel = scene.add.text(width / 2, 70, 'CHAMBER DEMO', {
            fontSize: '12px',
            fill: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.add(this.phaseLabel);

        // Fix to camera
        this.setScrollFactor(0);
        
        scene.add.existing(this);
    }

    updateShieldBar(value, maximum) {
        const percentage = Phaser.Math.Clamp(value / maximum, 0, 1);
        this.shieldBar.clear();
        
        // Background (Dark Red)
        this.shieldBar.fillStyle(0x440000, 1);
        this.shieldBar.fillRect(80, 15, 200, 15);
        
        // Determine color based on thresholds
        let color = 0x00ff00; // Green/cyan default
        if (percentage <= 0) {
            return; // Empty
        } else if (percentage <= 0.3) {
            color = 0xff0000; // Red
        } else if (percentage <= 0.6) {
            color = 0xffa500; // Yellow/amber
        }
        
        // Fill (Proportional width)
        this.shieldBar.fillStyle(color, 1);
        this.shieldBar.fillRect(80, 15, 200 * percentage, 15);
        
        // Border
        this.shieldBar.lineStyle(1, 0xffffff, 1);
        this.shieldBar.strokeRect(80, 15, 200, 15);
    }

    setShield(value, maximum) {
        this.updateShieldBar(value, maximum);
    }

    setScore(value) {
        this.scoreText.setText(`SCORE: ${value}`);
    }

    setWeaponStatus(weapon, status) {
        const text = `${weapon.toUpperCase()}: ${status.toUpperCase()}`;
        const color = status.toUpperCase() === 'READY' ? '#00ff00' : '#ff0000';
        
        if (weapon.toLowerCase() === 'energy') {
            this.weaponText.setText(text).setStyle({ fill: color });
        } else if (weapon.toLowerCase() === 'axe') {
            this.axeText.setText(text).setStyle({ fill: color });
        }
    }

    setPhaseLabel(label) {
        this.phaseLabel.setText(label);
    }
}
