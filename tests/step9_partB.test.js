import { test } from 'node:test';
import assert from 'node:assert';

// Mock Phaser Scale Manager behavior
class MockScale {
    constructor(w, h) {
        this.width = w;
        this.height = h;
        this.events = {};
    }
    on(event, cb) { this.events[event] = cb; }
    resize(w, h) {
        this.width = w;
        this.height = h;
        if (this.events['resize']) this.events['resize'](this.gameSize, this.baseSize, this.displaySize, this.previousSize);
    }
}

class MockCamera {
    constructor() {
        this.scrollX = 0;
        this.scrollY = 0;
        this.zoom = 1;
        this.bounds = { x: 0, y: 0, width: 1280, height: 50000 };
    }
    setZoom(z) { this.zoom = z; }
    setBounds(x, y, w, h) { this.bounds = { x, y, width: w, height: h }; }
}

test('Responsive viewport calculation', () => {
    const mockScale = new MockScale(1280, 960);
    const mockCamera = new MockCamera();
    
    const onResize = () => {
        const { width, height } = mockScale;
        const logicalHeight = 960;
        const zoom = height / logicalHeight;
        mockCamera.setZoom(zoom);
        const logicalWidth = width / zoom;
        return { logicalWidth, zoom };
    };
    
    // Desktop: 1280x960
    let res = onResize();
    assert.strictEqual(res.zoom, 1);
    assert.strictEqual(res.logicalWidth, 1280);
    
    // Narrow: 640x960
    mockScale.resize(640, 960);
    res = onResize();
    assert.strictEqual(res.zoom, 1);
    assert.strictEqual(res.logicalWidth, 640);
    
    // Smaller screen: 320x480
    mockScale.resize(320, 480);
    res = onResize();
    assert.strictEqual(res.zoom, 0.5);
    assert.strictEqual(res.logicalWidth, 640, 'Logical width should be 640 even if screen is smaller, because height is fixed at 960 logical units');
});

test('Horizontal camera tracking', () => {
    const worldWidth = 1280;
    const player = { x: 640 };
    const mockCamera = new MockCamera();
    
    const updateHorizontalCamera = (logicalWidth) => {
        if (logicalWidth >= worldWidth) {
            mockCamera.scrollX = 0;
        } else {
            const targetX = player.x - (logicalWidth / 2);
            mockCamera.scrollX = Math.max(0, Math.min(worldWidth - logicalWidth, targetX));
        }
    };
    
    // Case 1: Wide Desktop (1280 visible) -> No tracking
    updateHorizontalCamera(1280);
    assert.strictEqual(mockCamera.scrollX, 0);

    // Case 5: Ultra-wide (1920 visible) -> Centered (offset = (1280-1920)/2 = -320)
    const updateHorizontalCameraCentered = (logicalWidth) => {
        if (logicalWidth >= worldWidth) {
            mockCamera.scrollX = (worldWidth - logicalWidth) / 2;
        } else {
            const targetX = player.x - (logicalWidth / 2);
            mockCamera.scrollX = Math.max(0, Math.min(worldWidth - logicalWidth, targetX));
        }
    };
    updateHorizontalCameraCentered(1920);
    assert.strictEqual(mockCamera.scrollX, -320);
    
    // Case 2: Narrow (640 visible), Player at 640 -> Camera centered at 640-320 = 320
    player.x = 640;
    updateHorizontalCamera(640);
    assert.strictEqual(mockCamera.scrollX, 320);
    
    // Case 3: Player at left edge (0) -> Camera clamped to 0
    player.x = 100;
    updateHorizontalCamera(640);
    assert.strictEqual(mockCamera.scrollX, 0);
    
    // Case 4: Player at right edge (1280) -> Camera clamped to 1280-640 = 640
    player.x = 1200;
    updateHorizontalCamera(640);
    assert.strictEqual(mockCamera.scrollX, 640);
});
