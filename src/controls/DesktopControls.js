import { GAMEPLAY_CONFIG } from '../config/gameplayConfig.js';

/**
 * Desktop input handler for LORELEI: DESCENT.
 * Translates keyboard and mouse input into generic gameplay commands.
 */
export default class DesktopControls {
    /**
     * @param {Phaser.Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.config = GAMEPLAY_CONFIG.player;
        this.controlMode = this.loadControlMode();
        
        // Movement keys
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
            arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
            arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
            arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            nova: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Aim and actions
        this.aimWorldX = 0;
        this.aimWorldY = 0;
        this.isFiringPrimary = false;
        this.isFiringSecondary = false;
        this.isFiringNova = false;
        
        // Movement vectors (Normalized intent, -1 to 1)
        this.moveX = 0;
        this.moveY = 0;

        // Prevent browser context menu on gameplay canvas for right-click weapon
        scene.input.mouse.disableContextMenu();

        // Prevent input carry-over from scene transitions (e.g. START GAME click)
        this.ignoreInitialClick = true;

        // Listen for focus/resume to reset states
        this.onResume = () => this.reset();
        this.scene.game.events.on('resume', this.onResume);
        this.scene.input.on('pointerover', this.onResume);
    }

    loadControlMode() {
        try {
            return localStorage.getItem('lorelei_descent_control_mode') || this.config.defaultControlMode;
        } catch (e) {
            return this.config.defaultControlMode;
        }
    }

    setControlMode(mode) {
        this.controlMode = mode;
        try {
            localStorage.setItem('lorelei_descent_control_mode', mode);
        } catch (e) {}
    }

    /**
     * Resets input states (e.g. after focus regain or scene start)
     */
    reset() {
        this.moveX = 0;
        this.moveY = 0;
        this.isFiringPrimary = false;
        this.isFiringSecondary = false;
        this.isFiringNova = false;
        this.ignoreInitialClick = true; // Wait for release after focus regain
        
        // Reset keyboard states to prevent stuck keys after focus loss
        if (this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.resetKeys();
        }
    }

    /**
     * Updates the control state. Should be called every frame.
     */
    update() {
        const pointer = this.scene.input.activePointer;
        if (!pointer) return;

        // 1. Aim (Camera-aware world coordinates)
        this.aimWorldX = pointer.worldX;
        this.aimWorldY = pointer.worldY;

        // 2. Actions (Immediate detection for movement suppression)
        if (this.ignoreInitialClick) {
            // Only stop ignoring once all buttons are released
            if (!pointer.leftButtonDown() && !pointer.rightButtonDown()) {
                this.ignoreInitialClick = false;
            }
            this.isFiringPrimary = false;
            this.isFiringSecondary = false;
        } else {
            this.isFiringPrimary = pointer.leftButtonDown();
            this.isFiringSecondary = pointer.rightButtonDown();
        }

        // 3. Nova (Fresh key press only)
        this.isFiringNova = Phaser.Input.Keyboard.JustDown(this.keys.nova);

        // 4. Keyboard Movement (Priority)
        let kbMoveX = 0;
        let kbMoveY = 0;

        if (this.keys.up.isDown || this.keys.arrowUp.isDown) kbMoveY -= 1;
        if (this.keys.down.isDown || this.keys.arrowDown.isDown) kbMoveY += 1;
        if (this.keys.left.isDown || this.keys.arrowLeft.isDown) kbMoveX -= 1;
        if (this.keys.right.isDown || this.keys.arrowRight.isDown) kbMoveX += 1;

        if (kbMoveX !== 0 || kbMoveY !== 0) {
            this.moveX = kbMoveX;
            this.moveY = kbMoveY;
        } else if (this.controlMode === 'ASSISTED' && !this.isFiringSecondary && this.scene.player) {
            // 4. Mouse Assisted Movement
            this.calculateAssistedMovement(pointer);
        } else {
            this.moveX = 0;
            this.moveY = 0;
        }
    }

    /**
     * Calculates movement intent based on mouse position relative to player.
     */
    calculateAssistedMovement(pointer) {
        if (!pointer || !this.scene.player) return;

        const player = this.scene.player;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, pointer.worldX, pointer.worldY);
        
        const deadZone = this.config.assistedMovementRadius;
        const fullSpeedZone = this.config.assistedMovementFullSpeedRadius;

        // Reliable boundary check using actual viewport dimensions
        const viewportWidth = this.scene.scale.width;
        const viewportHeight = this.scene.scale.height;
        const isInsideCanvas = pointer.x >= 0 && pointer.x <= viewportWidth && pointer.y >= 0 && pointer.y <= viewportHeight;

        if (dist <= deadZone || !isInsideCanvas) {
            this.moveX = 0;
            this.moveY = 0;
            return;
        }

        // Scale speed intent between 0 and 1
        const intensity = Phaser.Math.Clamp((dist - deadZone) / (fullSpeedZone - deadZone), 0, 1);
        
        const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.worldX, pointer.worldY);
        this.moveX = Math.cos(angle) * intensity;
        this.moveY = Math.sin(angle) * intensity;
    }

    /**
     * Returns the current input state.
     * @returns {Object}
     */
    getState() {
        return {
            moveX: this.moveX,
            moveY: this.moveY,
            aimX: this.aimWorldX,
            aimY: this.aimWorldY,
            isFiringPrimary: this.isFiringPrimary,
            isFiringSecondary: this.isFiringSecondary,
            isFiringNova: this.isFiringNova,
            controlMode: this.controlMode
        };
    }

    destroy() {
        if (this.scene && this.scene.game) {
            this.scene.game.events.off('resume', this.onResume);
        }
    }
}
