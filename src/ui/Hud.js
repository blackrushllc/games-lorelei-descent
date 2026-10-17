import Phaser from 'phaser';

/**
 * Heads-up display for LORELEI: DESCENT.
 */
export default class Hud extends Phaser.GameObjects.Container {
    constructor(scene) {
        super(scene, 0, 0);

        const { width } = scene.game.config;
        this.logicalWidth = width;

        // Background for HUD top area
        this.bg = scene.add.graphics();
        this.add(this.bg);

        // Shield Label and Bar
        this.shieldText = scene.add.text(20, 15, 'SHIELD 100 / 100', { 
            fontSize: '14px', 
            fill: '#ffffff', 
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        this.add(this.shieldText);
        
        this.shieldBar = scene.add.graphics();
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

        // Hearts
        this.heartIcons = [];
        this.createHearts(width);

        // Initial Layout
        this.resize(width, 960);
        this.updateShieldBar(100, 100);

        // Fix to camera
        this.setScrollFactor(0);
        
        scene.add.existing(this);
    }

    createHearts(width) {
        const startX = width - 150;
        const y = 50;
        const spacing = 24;

        for (let i = 0; i < 6; i++) {
            const heart = this.scene.add.graphics();
            this.drawHeart(heart, 0, 0, 0xff0000); // Default red
            heart.x = startX + (i * spacing);
            heart.y = y;
            this.add(heart);
            this.heartIcons.push(heart);
        }
    }

    drawHeart(graphics, x, y, color) {
        graphics.clear();
        graphics.fillStyle(color, 1);
        
        // Simple procedural heart shape
        // Using two circles and a triangle
        graphics.fillCircle(x - 5, y - 5, 6);
        graphics.fillCircle(x + 5, y - 5, 6);
        
        graphics.beginPath();
        graphics.moveTo(x - 11, y - 4);
        graphics.lineTo(x + 11, y - 4);
        graphics.lineTo(x, y + 10);
        graphics.closePath();
        graphics.fillPath();

        // Optional outline for lost hearts
        if (color === 0x333333) {
            graphics.lineStyle(1, 0x666666, 1);
            graphics.strokeCircle(x - 5, y - 5, 6);
            graphics.strokeCircle(x + 5, y - 5, 6);
            graphics.beginPath();
            graphics.moveTo(x - 11, y - 4);
            graphics.lineTo(x + 11, y - 4);
            graphics.lineTo(x, y + 10);
            graphics.closePath();
            graphics.strokePath();
        }
    }

    setHearts(count, max) {
        for (let i = 0; i < this.heartIcons.length; i++) {
            if (i < count) {
                this.drawHeart(this.heartIcons[i], 0, 0, 0xff0000);
                this.heartIcons[i].setAlpha(1);
            } else {
                this.drawHeart(this.heartIcons[i], 0, 0, 0x333333);
                this.heartIcons[i].setAlpha(0.6);
            }
        }
    }

    resize(width, height) {
        this.logicalWidth = width;
        const playingWidth = 1280;
        const offset = width > playingWidth ? (width - playingWidth) / 2 : 0;

        // Redraw/Reposition HUD elements based on new logical width
        this.bg.clear();
        this.bg.fillStyle(0x000000, 0.5);
        this.bg.fillRect(offset, 0, 1280, 80);

        this.shieldText.setX(offset + 20);
        this.scoreText.setX(width - offset - 20);
        this.phaseLabel.setX(width / 2);

        this.weaponText.setX(offset + 20);
        this.axeText.setX(offset + 200);

        // Reposition Hearts
        const startX = width - offset - 150;
        const spacing = 24;
        for (let i = 0; i < this.heartIcons.length; i++) {
            this.heartIcons[i].x = startX + (i * spacing);
        }

        // Redraw bar to match new offset
        const player = this.scene.player;
        if (player) {
            this.updateShieldBar(player.shield, player.maxShield);
        } else {
            this.updateShieldBar(100, 100);
        }
    }

    updateShieldBar(value, maximum) {
        const playingWidth = 1280;
        const offset = this.logicalWidth > playingWidth ? (this.logicalWidth - playingWidth) / 2 : 0;
        const barX = offset + 160;

        const percentage = (maximum > 0 && !isNaN(value)) ? Phaser.Math.Clamp(value / maximum, 0, 1) : 0;
        
        // Update Text
        if (this.shieldText) {
            const displayValue = isNaN(value) ? 0 : Math.ceil(value);
            this.shieldText.setText(`SHIELD ${displayValue} / ${maximum}`);
        }

        this.shieldBar.clear();
        
        // Background (Dark Gray/Black Frame)
        this.shieldBar.fillStyle(0x222222, 1);
        this.shieldBar.fillRect(barX, 15, 200, 15);
        
        // Determine color based on thresholds
        let color = 0x00ffff; // Cyan/Green default
        
        if (percentage > 0) {
            if (percentage <= 0.3) {
                color = 0xff0000; // Red
            } else if (percentage <= 0.6) {
                color = 0xffa500; // Yellow/amber
            }

            // Fill (Proportional width)
            this.shieldBar.fillStyle(color, 1);
            this.shieldBar.fillRect(barX, 15, 200 * percentage, 15);
        }
        
        // Border
        this.shieldBar.lineStyle(2, 0xffffff, 1);
        this.shieldBar.strokeRect(barX, 15, 200, 15);
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
