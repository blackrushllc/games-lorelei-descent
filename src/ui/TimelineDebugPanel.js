import { TIMELINE_CONFIG } from '../config/timeline.js';
import { ASSISTANCE_CONFIG } from '../config/assistanceConfig.js';

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
        this.isExpanded = false;
        
        // Check for debug flag in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === '1') {
            this.init();
        }
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'timeline-debug-panel';
        this.applyStyles();
        
        // Stop all mouse events from propagating to the game canvas
        const stopProp = (e) => e.stopPropagation();
        this.container.addEventListener('mousedown', stopProp);
        this.container.addEventListener('mouseup', stopProp);
        this.container.addEventListener('click', stopProp);
        this.container.addEventListener('pointerdown', stopProp);
        this.container.addEventListener('pointerup', stopProp);
        this.container.addEventListener('touchstart', stopProp);
        this.container.addEventListener('touchend', stopProp);
        this.container.addEventListener('contextmenu', stopProp);
        this.container.addEventListener('wheel', stopProp);
        
        this.container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #555; padding-bottom: 5px; margin-bottom: 5px;">
                <div style="font-weight: bold;">LORELEI DEV TOOLS</div>
                <button id="btn-toggle-panel" style="margin: 0; padding: 2px 5px;">_</button>
            </div>
            
            <div id="debug-content" style="display: none;">
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
                <div class="debug-row">Mission Phase: <span id="diag-mission-phase">-</span></div>
                <div class="debug-row">Physics: <span id="diag-physics">-</span></div>
                <div class="debug-row">Scroll Y: <span id="diag-scroll-y">0</span></div>
                <div class="debug-row">Scroll X: <span id="diag-scroll-x">0</span></div>
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
                <div class="debug-row">Nova Ready: <span id="diag-nova-ready">NO</span></div>
                <div class="debug-row">Projectiles: <span id="diag-projectiles">0</span></div>
                <div class="debug-row">Axes: <span id="diag-axes">0</span></div>
                <div class="debug-row">Opening Proxy: <span id="diag-proxy">INACTIVE</span></div>
                <div class="debug-row">Assistance: <span id="diag-assistance">0 (1.0x)</span></div>
                <div class="debug-row">Hearts Collected: <span id="diag-hearts-collected">0</span></div>
                <div class="debug-row">Checkpoint: <span id="diag-checkpoint">NONE</span></div>
                <div class="debug-row">Retries: <span id="diag-retries">0</span></div>
            </div>

            <div id="debug-combat-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] COMBAT TOOLS</div>
            <div id="debug-combat" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-controls">
                    <button id="btn-reset-shield">RESET SHIELD</button>
                    <button id="btn-clear-robots">CLEAR ROBOTS</button>
                    <button id="btn-trigger-nova">TRIGGER NOVA</button>
                </div>
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-set-assistance-0">ASST: 0</button>
                    <button id="btn-set-assistance-1">1</button>
                    <button id="btn-set-assistance-2">2</button>
                    <button id="btn-set-assistance-3">3</button>
                </div>
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-unlock-proxy">UNLOCK PROXY CP</button>
                    <button id="btn-unlock-cathedral">CATHEDRAL CP</button>
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
                    <button id="btn-toggle-physics-debug">TOGGLE COLLISION</button>
                    <button id="btn-toggle-geometry-debug">TOGGLE GEOMETRY</button>
                </div>
                <div style="margin-top: 5px; font-weight: bold;">SET HEARTS:</div>
                <div class="debug-controls">
                    <button class="btn-set-hearts" data-value="6">6</button>
                    <button class="btn-set-hearts" data-value="2">2</button>
                    <button class="btn-set-hearts" data-value="1">1</button>
                    <button id="btn-trigger-heart-loss">LOSE HEART</button>
                </div>
            </div>

            <div id="debug-encounter-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] ENCOUNTER TOOLS</div>
            <div id="debug-encounter" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-row">Cue: <span id="diag-cue">-</span></div>
                <div class="debug-row">Scripted (Active): <span id="diag-robots-scripted">0</span></div>
                <div class="debug-row">Ambient (Active): <span id="diag-robots-ambient">0</span></div>
                <div class="debug-row">Retreating: <span id="diag-robots-retreat">0</span></div>
                <div class="debug-row">Inactive/Pooled: <span id="diag-robots-pooled">0</span></div>
                <div class="debug-row">Cap: <span id="diag-pop-cap">0</span></div>
                <div class="debug-row">Pending: <span id="diag-pending-form">0</span></div>
                <div class="debug-row">Next Ambient: <span id="diag-next-ambient">-</span></div>
                
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-toggle-encounter">TOGGLE AUTO</button>
                    <button id="btn-toggle-catchup">TOGGLE CATCHUP</button>
                </div>
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-spawn-patrol">PATROL (4)</button>
                    <button id="btn-spawn-wall">SENTINEL WALL (12)</button>
                    <button id="btn-partial-retreat">PARTIAL RETREAT</button>
                    <button id="btn-full-retreat">FULL RETREAT</button>
                    <button id="btn-clear-boss">CLEAR FOR BOSS</button>
                </div>
            </div>

            <div id="debug-proxy-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] PROXY TOOLS</div>
            <div id="debug-proxy" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-row">Boss Active: <span id="diag-proxy-active">NO</span></div>
                <div class="debug-row">Boss HP: <span id="diag-proxy-hp">0</span></div>
                <div class="debug-row">Boss State: <span id="diag-proxy-state">-</span></div>
                <div class="debug-row">Soldier: <span id="diag-soldier">INACTIVE</span></div>
                <div class="debug-row">Grenade: <span id="diag-grenade">INACTIVE</span></div>
                
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-spawn-proxy">SPAWN PROXY</button>
                    <button id="btn-proxy-stagger">STAGGER PROXY</button>
                    <button id="btn-proxy-die">DIE PROXY</button>
                </div>
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-spawn-soldier">SPAWN SOLDIER</button>
                    <button id="btn-trigger-grenade">TRIGGER GRENADE</button>
                </div>

                <div style="margin-top: 10px; border-top: 1px solid #333; padding-top: 5px;">
                    <div class="debug-row">Super Robot Active: <span id="diag-super-active">NO</span></div>
                    <div class="debug-row">Super Robot HP: <span id="diag-super-hp">0</span></div>
                    <div class="debug-row">Super Robot State: <span id="diag-super-state">-</span></div>
                    <div class="debug-controls" style="margin-top: 5px;">
                        <button id="btn-spawn-super">SPAWN SUPER</button>
                        <button id="btn-trigger-panzer-1">PANZER SHOT 1</button>
                        <button id="btn-trigger-panzer-2">PANZER SHOT 2</button>
                        <button id="btn-super-die">DIE SUPER</button>
                    </div>
                </div>
            </div>

            <div id="debug-sprites-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] SPRITE TOOLS</div>
            <div id="debug-sprites" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-row">Pixel Art: <span id="diag-pixel-art">ON</span></div>
                <div class="debug-row">Blackrush State: <span id="diag-br-state">-</span></div>
                <div class="debug-row">Blackrush Facing: <span id="diag-br-facing">-</span></div>
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-toggle-pixelart">TOGGLE PIXEL ART</button>
                </div>
            </div>

            <div id="debug-lorelei-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] LORELEI TOOLS</div>
            <div id="debug-lorelei" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-row">Lorelei Active: <span id="diag-lorelei-active">NO</span></div>
                <div class="debug-row">Auto Spawn: <span id="diag-lorelei-autospawn">PENDING</span></div>
                <div class="debug-row">Dist from BR: <span id="diag-lorelei-dist">0</span></div>
                <div class="debug-row">Follow Mode: <span id="diag-lorelei-mode">-</span></div>
                <div class="debug-row">Support: <span id="diag-lorelei-support">-</span></div>
                <div class="debug-row">TK Pulses: <span id="diag-lorelei-tk-pulses">0</span></div>
                <div class="debug-row">Last Affected: <span id="diag-lorelei-last-affected">0</span></div>
                <div class="debug-row">Last Destroyed: <span id="diag-lorelei-last-destroyed">0</span></div>
                <div class="debug-row">Last Disarmed: <span id="diag-lorelei-last-disarmed">0</span></div>
                <div class="debug-row">TK Cooldown: <span id="diag-lorelei-tk-cooldown">0</span></div>
                <div class="debug-row">Threats Near BR: <span id="diag-lorelei-threats">0</span></div>
                
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-spawn-lorelei">SPAWN LORELEI</button>
                    <button id="btn-trigger-tk">TRIGGER TK</button>
                </div>
            </div>

            <div id="debug-eclipse-toggle" style="margin-top: 10px; cursor: pointer; text-decoration: underline; font-size: 10px;">[+] ECLIPSE TOOLS</div>
            <div id="debug-eclipse" style="display: none; margin-top: 5px; font-size: 10px; color: #aaa; border-top: 1px solid #333; padding-top: 5px;">
                <div class="debug-row">Eclipse Active: <span id="diag-eclipse-active">NO</span></div>
                <div class="debug-row">Dist from BR: <span id="diag-eclipse-dist">0</span></div>
                <div class="debug-row">AI State: <span id="diag-eclipse-state">-</span></div>
                <div class="debug-row">Target: <span id="diag-eclipse-target">NONE</span></div>
                <div class="debug-row">Cooldown: <span id="diag-eclipse-cooldown">0</span></div>
                <div class="debug-row">Interceptions: <span id="diag-eclipse-interceptions">0</span></div>
                <div class="debug-row">Kills: <span id="diag-eclipse-kills">0</span></div>
                
                <div class="debug-controls" style="margin-top: 5px;">
                    <button id="btn-spawn-eclipse">SPAWN ECLIPSE</button>
                    <button id="btn-trigger-interception">FORCE ATTACK</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        this.setupEventListeners();
        this.isVisible = true;
        this.setExpanded(false); // Start collapsed
    }

    setExpanded(expanded) {
        this.isExpanded = expanded;
        const content = this.container.querySelector('#debug-content');
        const toggle = this.container.querySelector('#btn-toggle-panel');
        if (content) content.style.display = expanded ? 'block' : 'none';
        if (toggle) toggle.textContent = expanded ? '_' : '□';
        this.container.style.width = expanded ? '240px' : '150px';
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
        $('#btn-toggle-panel').onclick = () => this.setExpanded(!this.isExpanded);
        
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
            if (state.totalDuration > 0) {
                const newGlobalTime = (e.target.value / 100) * state.totalDuration;
                this.timeline.seekGlobal(newGlobalTime);
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

        $('#debug-encounter-toggle').onclick = () => {
            const encounter = $('#debug-encounter');
            const isHidden = encounter.style.display === 'none';
            encounter.style.display = isHidden ? 'block' : 'none';
            $('#debug-encounter-toggle').textContent = isHidden ? '[-] ENCOUNTER TOOLS' : '[+] ENCOUNTER TOOLS';
        };

        $('#debug-proxy-toggle').onclick = () => {
            const proxy = $('#debug-proxy');
            const isHidden = proxy.style.display === 'none';
            proxy.style.display = isHidden ? 'block' : 'none';
            $('#debug-proxy-toggle').textContent = isHidden ? '[-] PROXY TOOLS' : '[+] PROXY TOOLS';
        };

        $('#debug-sprites-toggle').onclick = () => {
            const sprites = $('#debug-sprites');
            const isHidden = sprites.style.display === 'none';
            sprites.style.display = isHidden ? 'block' : 'none';
            $('#debug-sprites-toggle').textContent = isHidden ? '[-] SPRITE TOOLS' : '[+] SPRITE TOOLS';
        };

        $('#debug-lorelei-toggle').onclick = () => {
            const lorelei = $('#debug-lorelei');
            const isHidden = lorelei.style.display === 'none';
            lorelei.style.display = isHidden ? 'block' : 'none';
            $('#debug-lorelei-toggle').textContent = isHidden ? '[-] LORELEI TOOLS' : '[+] LORELEI TOOLS';
        };

        $('#debug-eclipse-toggle').onclick = () => {
            const eclipse = $('#debug-eclipse');
            const isHidden = eclipse.style.display === 'none';
            eclipse.style.display = isHidden ? 'block' : 'none';
            $('#debug-eclipse-toggle').textContent = isHidden ? '[-] ECLIPSE TOOLS' : '[+] ECLIPSE TOOLS';
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

        $('#btn-trigger-nova').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.triggerNova) {
                gs.triggerNova();
            }
        };

        [0, 1, 2, 3].forEach(level => {
            const btn = $(`#btn-set-assistance-${level}`);
            if (btn) {
                btn.onclick = () => {
                    if (this.game.missionState) {
                        this.game.missionState.assistanceLevel = level;
                        console.log(`[DEBUG] Assistance level set to ${level}`);
                    }
                };
            }
        });

        const btnUnlockProxy = $('#btn-unlock-proxy');
        if (btnUnlockProxy) {
            btnUnlockProxy.onclick = () => {
                if (this.game.missionState) {
                    this.game.missionState.arenaCheckpoint = 'PROXY';
                    console.log(`[DEBUG] Proxy checkpoint unlocked`);
                }
            };
        }

        const btnUnlockCathedral = $('#btn-unlock-cathedral');
        if (btnUnlockCathedral) {
            btnUnlockCathedral.onclick = () => {
                if (this.game.missionState) {
                    this.game.missionState.arenaCheckpoint = 'SUPER_ROBOT';
                    console.log(`[DEBUG] Cathedral checkpoint unlocked`);
                }
            };
        }

        const spawnRobot = (type) => {
            const gs = getGameScene();
            if (gs && gs.player) {
                const pos = gs.findSafeRobotSpawnPosition();
                gs.spawnRobotAt(pos.x, pos.y, type);
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

        $('#btn-toggle-physics-debug').onclick = () => {
            const gs = getGameScene();
            if (gs) {
                const debug = gs.physics.world.drawDebug;
                gs.physics.world.drawDebug = !debug;
                if (!gs.physics.world.debugGraphic) {
                    gs.physics.world.createDebugGraphic();
                }
                gs.physics.world.debugGraphic.clear();
            }
        };

        $('#btn-toggle-geometry-debug').onclick = () => {
            const gs = getGameScene();
            if (gs) {
                gs.debugGeometry = !gs.debugGeometry;
                console.log(`[DEBUG] Combat Geometry: ${gs.debugGeometry ? 'ON' : 'OFF'}`);
            }
        };

        $('#btn-toggle-pixelart').onclick = () => {
            const gs = getGameScene();
            if (gs) {
                const nextState = !gs.player.pixelArtEnabled;
                
                // Toggle player
                gs.player.setPixelArtEnabled(nextState);
                
                // Toggle all robots
                gs.robotGroup.getChildren().forEach(r => {
                    if (r.setPixelArtEnabled) r.setPixelArtEnabled(nextState);
                });

                // Toggle other scripted entities if they exist
                if (gs.openingProxy && gs.openingProxy.setPixelArtEnabled) {
                    gs.openingProxy.setPixelArtEnabled(nextState);
                }
                if (gs.proxyBoss && gs.proxyBoss.setPixelArtEnabled) {
                    gs.proxyBoss.setPixelArtEnabled(nextState);
                }
                if (gs.germanSoldier && gs.germanSoldier.setPixelArtEnabled) {
                    gs.germanSoldier.setPixelArtEnabled(nextState);
                }
                if (gs.lorelei && gs.lorelei.setPixelArtEnabled) {
                    gs.lorelei.setPixelArtEnabled(nextState);
                }
                if (gs.eclipse && gs.eclipse.setPixelArtEnabled) {
                    gs.eclipse.setPixelArtEnabled(nextState);
                }
            }
        };

        // Lorelei tool actions
        $('#btn-spawn-lorelei').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.spawnLorelei();
        };

        $('#btn-trigger-tk').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.lorelei && gs.player) {
                gs.lorelei.triggerTelekinesis(gs.player);
            }
        };

        $('#btn-spawn-eclipse').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.spawnEclipse();
        };

        $('#btn-trigger-interception').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.eclipse) {
                const target = gs.eclipse.acquireTarget();
                if (target) {
                    gs.eclipse.startInterception(target);
                }
            }
        };

        // Encounter tool actions
        $('#btn-toggle-encounter').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.encounterDirector) {
                gs.encounterDirector.enabled = !gs.encounterDirector.enabled;
            }
        };

        $('#btn-toggle-catchup').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.encounterDirector) {
                gs.encounterDirector.catchUpEnabled = !gs.encounterDirector.catchUpEnabled;
            }
        };

        $('#btn-spawn-patrol').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.encounterDirector) {
                gs.encounterDirector.executeCue({
                    id: 'DEBUG_PATROL',
                    type: 'SPAWN',
                    formation: 'PATROL',
                    robotTypes: ['PURSUER'],
                    counts: { PURSUER: 4 },
                    spawnRegion: 'BOTTOM' // Use BOTTOM for manual patrol spawn
                }, true);
            }
        };

        $('#btn-spawn-wall').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.encounterDirector) {
                gs.encounterDirector.executeCue({
                    id: 'DEBUG_WALL',
                    type: 'SPAWN',
                    formation: 'SENTINEL_WALL',
                    robotTypes: ['SENTINEL'],
                    counts: { SENTINEL: 12 },
                    spawnRegion: 'TOP_RANDOM' // Use TOP_RANDOM (now inside viewport)
                }, true);
            }
        };

        $('#btn-partial-retreat').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.encounterDirector) {
                gs.encounterDirector.executeCue({
                    id: 'DEBUG_PARTIAL_RETREAT',
                    type: 'RETREAT',
                    retreatFraction: 0.5
                });
            }
        };

        $('#btn-full-retreat').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.encounterDirector) {
                gs.encounterDirector.executeCue({
                    id: 'DEBUG_FULL_RETREAT',
                    type: 'RETREAT',
                    retreatFraction: 1.0
                });
            }
        };

        $('#btn-clear-boss').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.encounterDirector) {
                gs.encounterDirector.executeCue({
                    id: 'DEBUG_CLEAR_BOSS',
                    type: 'CLEAR_FOR_BOSS'
                });
            }
        };

        // Proxy Boss tool actions
        $('#btn-spawn-proxy').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.handleProxyReleaseNadine();
        };

        $('#btn-proxy-stagger').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.proxyBoss) gs.proxyBoss.state = 'STAGGERED';
        };

        $('#btn-proxy-die').onclick = () => {
            const gs = getGameScene();
            if (gs && gs.proxyBoss) gs.proxyBoss.die();
        };

        $('#btn-spawn-soldier').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.handleGermanSoldierArrival();
        };

        $('#btn-trigger-grenade').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.handleGrenadeSequence();
        };

        $('#btn-spawn-super').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.handleSuperRobotAppears();
        };

        $('#btn-trigger-panzer-1').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.handlePanzerShot(1);
        };

        $('#btn-trigger-panzer-2').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.handlePanzerShot(2);
        };

        $('#btn-super-die').onclick = () => {
            const gs = getGameScene();
            if (gs) gs.handleFinalBossDestruction();
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
        
        if (state.totalDuration > 0) {
            $('#debug-slider').value = (state.globalTime / state.totalDuration) * 100;
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
                $('#diag-mission-phase').textContent = state.phase?.id || '-';
                const isPhysicsRunning = !gameScene.physics.world.isPaused;
                $('#diag-physics').textContent = isPhysicsRunning ? 'RUNNING' : 'PAUSED';
                $('#diag-scroll-y').textContent = Math.round(cam.scrollY);
                $('#diag-scroll-x').textContent = Math.round(cam.scrollX);
                
                if (dc) {
                    $('#diag-cam-mode').textContent = dc.getCameraMode(state.track, state.time);
                    $('#diag-arena-depth').textContent = Math.round(dc.getArenaPosition());
                }

                if (gameScene.proxyBoss) {
                    $('#diag-proxy-active').textContent = 'YES';
                    $('#diag-proxy-hp').textContent = Math.round(gameScene.proxyBoss.hp);
                    $('#diag-proxy-state').textContent = gameScene.proxyBoss.state;
                } else {
                    $('#diag-proxy-active').textContent = 'NO';
                }

                $('#diag-soldier').textContent = gameScene.germanSoldier ? 'ACTIVE' : 'INACTIVE';
                $('#diag-grenade').textContent = gameScene.grenade ? 'ACTIVE' : 'INACTIVE';

                if (gameScene.superRobot) {
                    $('#diag-super-active').textContent = 'YES';
                    $('#diag-super-hp').textContent = Math.round(gameScene.superRobot.hp);
                    $('#diag-super-state').textContent = gameScene.superRobot.state;
                } else {
                    $('#diag-super-active').textContent = 'NO';
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

                if (gameScene.openingProxy) {
                    const op = gameScene.openingProxy;
                    $('#diag-proxy').textContent = op.visible ? `ACTIVE (Y=${Math.round(op.y)})` : 'INACTIVE';
                }

                // PART A: Assistance & Checkpoints
                if (this.game.missionState) {
                    const ms = this.game.missionState;
                    const mult = ASSISTANCE_CONFIG.spawnMultipliers[Math.min(ms.assistanceLevel, ASSISTANCE_CONFIG.spawnMultipliers.length - 1)];
                    $('#diag-assistance').textContent = `${ms.assistanceLevel} (${mult}x)`;
                    $('#diag-hearts-collected').textContent = ms.heartsCollected;
                    $('#diag-checkpoint').textContent = ms.arenaCheckpoint || 'NONE';
                    $('#diag-retries').textContent = ms.retryCount;
                }

                // Sprite diagnostics
                if (p) {
                    $('#diag-pixel-art').textContent = p.pixelArtEnabled ? 'ON' : 'OFF';
                    const animKey = p.sprite?.anims?.currentAnim?.key || '';
                    const statePart = animKey.split('_')[1] || '-';
                    $('#diag-br-state').textContent = statePart;
                    $('#diag-br-facing').textContent = p.currentFacing || '-';
                }

                // Lorelei diagnostics
                if (gameScene.lorelei) {
                    const l = gameScene.lorelei;
                    $('#diag-lorelei-active').textContent = 'YES';
                    
                    const isSwarm = state.track === 'SYNTH' && state.phase?.id === 'ROBOT_SWARM';
                    $('#diag-lorelei-autospawn').textContent = isSwarm ? 'ACTIVE' : 'COMPLETED';
                    
                    const distFromBR = Math.round(Phaser.Math.Distance.Between(l.x, l.y, p.x, p.y));
                    $('#diag-lorelei-dist').textContent = distFromBR;
                    $('#diag-lorelei-mode').textContent = l.followState;
                    
                    const canSupport = distFromBR <= l.followConfig.maximumSupportDistance;
                    $('#diag-lorelei-support').textContent = canSupport ? 'READY' : 'TOO FAR';
                    $('#diag-lorelei-support').style.color = canSupport ? '#00ff00' : '#ff0000';
                    
                    $('#diag-lorelei-tk-pulses').textContent = l.stats.totalPulses;
                    $('#diag-lorelei-last-affected').textContent = l.stats.lastAffected;
                    $('#diag-lorelei-last-destroyed').textContent = l.stats.lastDestroyed;
                    $('#diag-lorelei-last-disarmed').textContent = l.stats.lastDisarmed;

                    $('#diag-lorelei-tk-cooldown').textContent = (Math.max(0, l.telekinesisCooldownTimer) / 1000).toFixed(1) + 's';
                    
                    // Count threats near player
                    const threats = gameScene.robotGroup.getChildren().filter(r => {
                        if (!r.active || r.isDestroyed || r.aiState === 'RETREATING') return false;
                        const tr = r.getTargetRegion ? r.getTargetRegion() : { x: r.x, y: r.y };
                        const playerTR = p.getTargetRegion ? p.getTargetRegion() : { x: p.x, y: p.y };
                        return Phaser.Math.Distance.Between(tr.x, tr.y, playerTR.x, playerTR.y) < l.defenseConfig.threatRadius;
                    });
                    $('#diag-lorelei-threats').textContent = threats.length;
                } else {
                    $('#diag-lorelei-active').textContent = 'NO';
                    
                    const isSwarm = state.track === 'SYNTH' && state.phase?.id === 'ROBOT_SWARM';
                    $('#diag-lorelei-autospawn').textContent = isSwarm ? 'FAILED' : 'PENDING';
                    
                    $('#diag-lorelei-dist').textContent = '-';
                    $('#diag-lorelei-mode').textContent = '-';
                    $('#diag-lorelei-support').textContent = '-';
                    $('#diag-lorelei-tk-pulses').textContent = '0';
                    $('#diag-lorelei-last-affected').textContent = '0';
                    $('#diag-lorelei-last-destroyed').textContent = '0';
                    $('#diag-lorelei-last-disarmed').textContent = '0';
                    $('#diag-lorelei-tk-cooldown').textContent = '-';
                    $('#diag-lorelei-threats').textContent = '-';
                }

                // Eclipse diagnostics (Step 10.4)
                if (gameScene.eclipse) {
                    const e = gameScene.eclipse;
                    $('#diag-eclipse-active').textContent = 'YES';
                    const distFromBR = Math.round(Phaser.Math.Distance.Between(e.x, e.y, p.x, p.y));
                    $('#diag-eclipse-dist').textContent = distFromBR;
                    $('#diag-eclipse-state').textContent = e.aiState;
                    $('#diag-eclipse-target').textContent = e.target ? (e.target.type || 'ROBOT') : 'NONE';
                    $('#diag-eclipse-cooldown').textContent = (Math.max(0, e.cooldownTimer) / 1000).toFixed(1) + 's';
                    $('#diag-eclipse-interceptions').textContent = e.stats.totalInterceptions;
                    $('#diag-eclipse-kills').textContent = e.stats.totalKills;
                } else {
                    $('#diag-eclipse-active').textContent = 'NO';
                    $('#diag-eclipse-dist').textContent = '-';
                    $('#diag-eclipse-state').textContent = '-';
                    $('#diag-eclipse-target').textContent = '-';
                    $('#diag-eclipse-cooldown').textContent = '-';
                    $('#diag-eclipse-interceptions').textContent = '0';
                    $('#diag-eclipse-kills').textContent = '0';
                }

                // Encounter Diagnostics
                if (gameScene.encounterDirector) {
                    const ed = gameScene.encounterDirector;
                    const allRobots = gameScene.robotGroup.getChildren();
                    const activeRobots = allRobots.filter(r => r.active && !r.isDestroyed);
                    const retreatingCount = activeRobots.filter(r => r.aiState === 'RETREATING').length;
                    const ambientCount = activeRobots.filter(r => !r.cueID && r.aiState !== 'RETREATING').length;
                    const scriptedCount = activeRobots.filter(r => r.cueID && r.aiState !== 'RETREATING').length;
                    const pooledCount = allRobots.length - activeRobots.length;
                    
                    $('#diag-cue').textContent = [...ed.activeCues].pop() || 'NONE';
                    $('#diag-robots-scripted').textContent = scriptedCount;
                    $('#diag-robots-ambient').textContent = ambientCount;
                    $('#diag-robots-retreat').textContent = retreatingCount;
                    $('#diag-robots-pooled').textContent = pooledCount;
                    $('#diag-pop-cap').textContent = ed.maxActive;
                    $('#diag-pending-form').textContent = ed.pendingFormations.length;
                    $('#diag-next-ambient').textContent = ed.nextAmbientTime.toFixed(1) + 's';

                    if ($('#diag-nova-ready')) {
                        const available = gs.player && gs.player.hearts >= 2;
                        $('#diag-nova-ready').textContent = available ? 'YES' : 'NO';
                        $('#diag-nova-ready').style.color = available ? '#00ffff' : '#ff0000';
                    }
                    
                    $('#btn-toggle-encounter').style.color = ed.enabled ? '#00ff00' : '#ff0000';
                    $('#btn-toggle-catchup').style.color = ed.catchUpEnabled ? '#00ff00' : '#ff0000';
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
