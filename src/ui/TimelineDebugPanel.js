/**
 * HTML-based developer panel for controlling and inspecting the timeline.
 */
export default class TimelineDebugPanel {
    /**
     * @param {Phaser.Game} game 
     */
    constructor(game) {
        this.game = game;
        this.timeline = game.timelineDirector;
        this.container = null;
        this.isVisible = false;
        
        // Check for debug flag in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === '1' || window.location.hostname === 'localhost') {
            this.init();
        }
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'timeline-debug-panel';
        this.applyStyles();
        
        this.container.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #555;">DEVELOPMENT TOOLS</div>
            
            <div class="debug-row">Session: <span id="debug-session">-</span></div>
            <div class="debug-row">Track: <span id="debug-track">-</span></div>
            <div class="debug-row">Phase: <span id="debug-phase">-</span></div>
            <div class="debug-row">Time: <span id="debug-time">00:00</span> / <span id="debug-duration">00:00</span></div>
            <div class="debug-row">Global: <span id="debug-global">0.00</span>s</div>
            <div class="debug-row">State: <span id="debug-state">STOPPED</span></div>
            
            <div style="margin: 10px 0;">
                <input type="range" id="debug-slider" min="0" max="100" value="0" style="width: 100%;">
            </div>
            
            <div class="debug-controls">
                <button id="btn-play">PLAY/RESUME</button>
                <button id="btn-pause">PAUSE</button>
                <button id="btn-stop">STOP/TITLE</button>
                <button id="btn-restart">RESTART</button>
            </div>
            
            <div class="debug-controls" style="margin-top: 5px;">
                <button id="btn-seek-back">-10s</button>
                <button id="btn-seek-forward">+10s</button>
            </div>
            
            <div style="margin-top: 10px; font-weight: bold; font-size: 10px;">JUMP TO:</div>
            <div class="debug-jumps">
                <button data-track="SYNTH" data-time="0">CHASE</button>
                <button data-track="SYNTH" data-time="45">SWARM</button>
                <button data-track="SYNTH" data-time="300">PROXY</button>
                <button data-track="CATHEDRAL" data-time="0">SUPER-ROBOT</button>
                <button data-track="CATHEDRAL" data-time="180">PANZER 1</button>
                <button data-track="CATHEDRAL" data-time="210">PANZER 2</button>
                <button data-track="STUDIO" data-time="0">VICTORY</button>
            </div>

            <div id="debug-diagnostics-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] TECHNICAL DIAGNOSTICS</div>
            <div id="debug-diagnostics" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-row">Active Scene: <span id="diag-active-scene">-</span></div>
                <div class="debug-row">Physics: <span id="diag-physics">-</span></div>
                <div class="debug-row">Scroll Y: <span id="diag-scroll-y">0</span></div>
                <div class="debug-row">Camera Mode: <span id="diag-cam-mode">-</span></div>
                <div class="debug-row">Arena Depth: <span id="diag-arena-depth">0</span></div>
                <div class="debug-row">Control Mode: <span id="diag-ctrl-mode">-</span></div>
                <div class="debug-row">Mouse Dist: <span id="diag-mouse-dist">0</span></div>
                <div class="debug-row">Assisted Active: <span id="diag-assisted-active">NO</span></div>
                <div class="debug-row">Player World: <span id="diag-player-world">-</span></div>
                <div class="debug-row">Player Screen: <span id="diag-player-screen">-</span></div>
                <div class="debug-row">Speed: <span id="diag-speed">0</span></div>
                <div class="debug-row">Shield: <span id="diag-shield">0</span></div>
                <div class="debug-row">Hearts: <span id="diag-hearts">0</span></div>
                <div class="debug-row">Regen: <span id="diag-regen">-</span></div>
                <div class="debug-row">Respawn: <span id="diag-respawn">NO</span></div>
                <div class="debug-row">Invuln: <span id="diag-invuln">NO</span></div>
                <div class="debug-row">Score: <span id="diag-score">0</span></div>
                <div class="debug-row">Projectiles: <span id="diag-projectiles">0</span></div>
                <div class="debug-row">Axes: <span id="diag-axes">0</span></div>
            </div>

            <div id="debug-combat-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] COMBAT TOOLS</div>
            <div id="debug-combat" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-controls">
                    <button id="btn-reset-shield">RESET SHIELD</button>
                    <button id="btn-clear-robots">CLEAR ROBOTS</button>
                </div>
                <div style="margin-top: 5px; font-weight: bold;">SET SHIELD:</div>
                <div class="debug-controls">
                    <button class="btn-set-shield" data-value="100">100</button>
                    <button class="btn-set-shield" data-value="75">75</button>
                    <button class="btn-set-shield" data-value="50">50</button>
                    <button class="btn-set-shield" data-value="25">25</button>
                    <button class="btn-set-shield" data-value="5">5</button>
                    <button class="btn-set-shield" data-value="0">0</button>
                </div>
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-spawn-pursuer">SPAWN PURSUER</button>
                    <button id="btn-spawn-sentinel">SPAWN SENTINEL</button>
                    <button id="btn-spawn-armored">SPAWN ARMORED</button>
                </div>
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-toggle-invuln">TOGGLE INVULN</button>
                </div>
                <div style="margin-top: 5px; font-weight: bold;">SET HEARTS:</div>
                <div class="debug-controls">
                    <button class="btn-set-hearts" data-value="6">6</button>
                    <button class="btn-set-hearts" data-value="2">2</button>
                    <button class="btn-set-hearts" data-value="1">1</button>
                    <button id="btn-trigger-heart-loss">LOSE HEART</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.setupEventListeners();
        this.isVisible = true;
    }

    applyStyles() {
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            width: '240px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '12px',
            padding: '10px',
            zIndex: '1000',
            border: '1px solid #00ff00',
            borderRadius: '4px',
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
        });

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            #timeline-debug-panel button {
                background: #333;
                color: #fff;
                border: 1px solid #555;
                padding: 3px 6px;
                margin: 2px;
                cursor: pointer;
                font-size: 10px;
            }
            #timeline-debug-panel button:hover {
                background: #444;
            }
            .debug-row { margin: 2px 0; }
            .debug-controls { display: flex; flex-wrap: wrap; }
            .debug-jumps { display: flex; flex-wrap: wrap; margin-top: 5px; }
        `;
        document.head.appendChild(styleSheet);
    }

    setupEventListeners() {
        const $ = (id) => this.container.querySelector(id);
        
        $('#btn-play').onclick = () => this.timeline.resume();
        $('#btn-pause').onclick = () => this.timeline.pause();
        $('#btn-stop').onclick = () => {
            this.timeline.stop();
            // Emit custom event for GameScene to handle
            this.timeline.emit('debugReturnToTitle');
        };
        $('#btn-restart').onclick = () => {
            const state = this.timeline.getState();
            if (state.track) {
                this.timeline.startTrack(state.track);
            }
        };
        
        $('#btn-seek-back').onclick = () => {
            const state = this.timeline.getState();
            this.timeline.seek(Math.max(0, state.time - 10));
        };
        
        $('#btn-seek-forward').onclick = () => {
            const state = this.timeline.getState();
            this.timeline.seek(state.time + 10);
        };
        
        $('#debug-slider').oninput = (e) => {
            const state = this.timeline.getState();
            if (state.duration > 0) {
                const newTime = (e.target.value / 100) * state.duration;
                this.timeline.seek(newTime);
            }
        };

        this.container.querySelectorAll('.debug-jumps button').forEach(btn => {
            btn.onclick = () => {
                const track = btn.dataset.track;
                const time = parseFloat(btn.dataset.time);
                this.timeline.startTrack(track);
                // Delay seek slightly to ensure track has started
                setTimeout(() => this.timeline.seek(time), 50);
            };
        });

        $('#debug-diagnostics-toggle').onclick = () => {
            const diag = $('#debug-diagnostics');
            const isHidden = diag.style.display === 'none';
            diag.style.display = isHidden ? 'block' : 'none';
            $('#debug-diagnostics-toggle').textContent = isHidden ? '[-] TECHNICAL DIAGNOSTICS' : '[+] TECHNICAL DIAGNOSTICS';
        };

        $('#debug-combat-toggle').onclick = () => {
            const combat = $('#debug-combat');
            const isHidden = combat.style.display === 'none';
            combat.style.display = isHidden ? 'block' : 'none';
            $('#debug-combat-toggle').textContent = isHidden ? '[-] COMBAT TOOLS' : '[+] COMBAT TOOLS';
        };

        // Combat tool actions
        const getGameScene = () => this.game.scene.getScenes(true).find(s => s.scene.key === 'GameScene');
        
        $('#btn-reset-shield').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.player) {
                gs.player.shield = gs.player.maxShield;
                gs.hud.setShield(gs.player.shield, gs.player.maxShield);
            }
        };

        this.container.querySelectorAll('.btn-set-shield').forEach(btn => {
            btn.onclick = () => {
                const gs = getGameScene();
                if (gs && gs.player) {
                    const val = parseFloat(btn.dataset.value);
                    gs.player.shield = val;
                    gs.hud.setShield(gs.player.shield, gs.player.maxShield);
                }
            };
        });

        this.container.querySelectorAll('.btn-set-hearts').forEach(btn => {
            btn.onclick = () => {
                const gs = getGameScene();
                if (gs && gs.player) {
                    const val = parseInt(btn.dataset.value);
                    gs.player.hearts = val;
                    gs.hud.setHearts(gs.player.hearts, gs.player.maxHearts);
                }
            };
        });

        $('#btn-trigger-heart-loss').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.player) {
                gs.handlePlayerDefeat();
            }
        };

        $('#btn-clear-robots').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.robotGroup) {
                gs.robotGroup.clear(true, true);
            }
        };

        const spawnRobot = (type) => {
            const gs = getGameScene();
            if (gs && gs.player) {
                const rx = gs.player.x + (Math.random() - 0.5) * 400;
                const ry = gs.player.y - 300 - Math.random() * 200;
                const Robot = gs.robotGroup.classType;
                const robot = new Robot(gs, rx, ry, type);
                gs.robotGroup.add(robot);
            }
        };

        $('#btn-spawn-pursuer').onclick = () => spawnRobot('PURSUER');
        $('#btn-spawn-sentinel').onclick = () => spawnRobot('SENTINEL');
        $('#btn-spawn-armored').onclick = () => spawnRobot('ARMORED_PURSUER');

        $('#btn-toggle-invuln').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.player) {
                gs.player.debugInvulnerable = !gs.player.debugInvulnerable;
                // Patch the isInvulnerable method if needed or handle it in Blackrush update
                if (!gs.player.originalIsInvulnerable) {
                    gs.player.originalIsInvulnerable = gs.player.isInvulnerable;
                    gs.player.isInvulnerable = function() {
                        return this.debugInvulnerable || this.originalIsInvulnerable();
                    };
                }
            }
        };
    }

    update() {
        if (!this.isVisible) return;
        
        const state = this.timeline.getState();
        const $ = (id) => this.container.querySelector(id);
        
        $('#debug-session').textContent = this.game.sessionID || '-';
        $('#debug-track').textContent = state.track || 'NONE';
        $('#debug-phase').textContent = state.phase;
        $('#debug-time').textContent = this.formatTime(state.time);
        $('#debug-duration').textContent = this.formatTime(state.duration);
        $('#debug-global').textContent = state.globalTime.toFixed(2);
        
        let status = 'STOPPED';
        if (state.isPlaying) status = 'PLAYING';
        else if (state.isPaused) status = 'PAUSED';
        $('#debug-state').textContent = status;
        
        if (state.duration > 0) {
            $('#debug-slider').value = (state.time / state.duration) * 100;
        }

        // Update Diagnostics
        const diag = $('#debug-diagnostics');
        if (diag.style.display !== 'none') {
            const activeScenes = this.game.scene.getScenes(true);
            const gameScene = activeScenes.find(s => s.scene.key === 'GameScene');
            
            if (gameScene) {
                const cam = gameScene.cameras.main;
                const p = gameScene.player;
                const ws = gameScene.weaponSystem;
                const dc = gameScene.descentController;
                const ctrl = gameScene.controls;
                const state = this.timeline.getState();
                
                $('#diag-active-scene').textContent = 'GameScene';
                const isPhysicsRunning = !gameScene.physics.world.isPaused;
                $('#diag-physics').textContent = isPhysicsRunning ? 'RUNNING' : 'PAUSED';
                $('#diag-scroll-y').textContent = Math.round(cam.scrollY);
                
                if (dc) {
                    $('#diag-cam-mode').textContent = dc.getCameraMode(state.track, state.time);
                    $('#diag-arena-depth').textContent = Math.round(dc.getArenaPosition());
                }

                if (ctrl) {
                    const ctrlState = ctrl.getState();
                    $('#diag-ctrl-mode').textContent = ctrlState.controlMode;
                    
                    if (p) {
                        const dist = Math.round(Phaser.Math.Distance.Between(p.x, p.y, ctrlState.aimX, ctrlState.aimY));
                        $('#diag-mouse-dist').textContent = dist;
                        
                        const isAssisted = ctrlState.controlMode === 'ASSISTED' && 
                                           dist > gameScene.controls.config.assistedMovementRadius &&
                                           !ctrlState.isFiringSecondary;
                        $('#diag-assisted-active').textContent = isAssisted ? 'YES' : 'NO';
                    }
                }

                if (p && p.body) {
                    $('#diag-player-world').textContent = `${Math.round(p.x)}, ${Math.round(p.y)}`;
                    $('#diag-player-screen').textContent = `${Math.round(p.x)}, ${Math.round(p.y - cam.scrollY)}`;
                    $('#diag-speed').textContent = Math.round(p.body.speed);
                    $('#diag-shield').textContent = `${Math.round(p.shield)} / ${p.maxShield}`;
                    $('#diag-hearts').textContent = `${p.hearts} / ${p.maxHearts}`;
                    
                    const regenWait = Math.max(0, (p.combatConfig.regenDelay - (this.game.loop.now - p.lastDamageTime)) / 1000).toFixed(1);
                    $('#diag-regen').textContent = p.shield < p.maxShield ? (regenWait > 0 ? `WAIT ${regenWait}s` : 'ACTIVE') : 'FULL';
                    
                    $('#diag-respawn').textContent = p.isRespawning ? 'YES' : 'NO';
                    $('#diag-invuln').textContent = p.isInvulnerable() ? 'YES' : 'NO';
                }
                $('#diag-score').textContent = gameScene.score || 0;
                if (ws) {
                    $('#diag-projectiles').textContent = ws.getActiveProjectileCount();
                    $('#diag-axes').textContent = ws.getActiveAxeCount();
                }
            } else {
                const otherScene = activeScenes.length > 0 ? activeScenes[0].scene.key : 'NONE';
                $('#diag-active-scene').textContent = otherScene;
                $('#diag-physics').textContent = 'N/A';
                $('#diag-scroll-y').textContent = 'N/A';
                $('#diag-cam-mode').textContent = '-';
                $('#diag-arena-depth').textContent = '0';
                $('#diag-ctrl-mode').textContent = '-';
                $('#diag-mouse-dist').textContent = '0';
                $('#diag-assisted-active').textContent = 'NO';
                $('#diag-player-world').textContent = 'N/A';
                $('#diag-player-screen').textContent = 'N/A';
                $('#diag-speed').textContent = '0';
                $('#diag-shield').textContent = '0';
                $('#diag-invuln').textContent = 'NO';
                $('#diag-score').textContent = '0';
                $('#diag-projectiles').textContent = '0';
                $('#diag-axes').textContent = '0';
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
