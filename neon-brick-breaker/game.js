// Neon Brick Breaker - game.js

// Sound Synthesis Engine using Web Audio API
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freqStart, freqEnd, duration, type = 'sine', volume = 0.15) {
    if (this.muted) return;
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
      }
      
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Web Audio API error:", e);
    }
  }

  playPaddleHit() {
    this.playTone(200, 450, 0.12, 'triangle', 0.18);
  }

  playBrickNormal() {
    this.playTone(600, 900, 0.08, 'sine', 0.1);
  }

  playBrickHard() {
    this.playTone(350, 200, 0.14, 'triangle', 0.15);
  }

  playBrickExplosive() {
    if (this.muted) return;
    this.init();
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      
      // Explosion sound synthesis using a custom buffer
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.35);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noise.start();
    } catch (e) {
      // Fallback
      this.playTone(150, 60, 0.4, 'sawtooth', 0.2);
    }
  }

  playPowerup() {
    // A nice ascending arpeggio
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.playTone(440, 880, 0.2, 'sine', 0.12);
    setTimeout(() => this.playTone(554.37, 1108.73, 0.2, 'sine', 0.12), 60);
    setTimeout(() => this.playTone(659.25, 1318.51, 0.2, 'sine', 0.12), 120);
  }

  playLaser() {
    this.playTone(880, 330, 0.08, 'sawtooth', 0.08);
  }

  playLevelClear() {
    // Triumph fanfare
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((note, idx) => {
      setTimeout(() => {
        this.playTone(note, note, 0.25, 'sine', 0.15);
      }, idx * 100);
    });
  }

  playGameOver() {
    // A sad descending scale
    const notes = [523.25, 493.88, 440.00, 392.00, 349.23, 329.63, 261.63, 196.00];
    notes.forEach((note, idx) => {
      setTimeout(() => {
        this.playTone(note, note - 50, 0.3, 'sawtooth', 0.12);
      }, idx * 140);
    });
  }
  
  playLostLife() {
    this.playTone(330, 110, 0.4, 'sawtooth', 0.18);
  }
}

const sounds = new SoundEngine();

// --- Game Constants & Palette ---
const NEON_COLORS = {
  cyan: '#00f2fe',
  magenta: '#ff007f',
  purple: '#9d4edd',
  green: '#39ff14',
  yellow: '#fffb00',
  orange: '#ff6b00',
  blue: '#0070f3',
  white: '#ffffff'
};

const BRICK_TYPES = {
  1: { name: 'Normal', hits: 1, color: NEON_COLORS.cyan, pts: 100 },
  2: { name: 'Double', hits: 2, color: NEON_COLORS.orange, pts: 250 },
  3: { name: 'Steel', hits: 3, color: NEON_COLORS.purple, pts: 500 },
  4: { name: 'Explosive', hits: 1, color: NEON_COLORS.magenta, pts: 300 },
  5: { name: 'Indestructible', hits: Infinity, color: NEON_COLORS.white, pts: 0 }
};

const POWERUP_TYPES = {
  MULTIBALL: { code: 'M', color: NEON_COLORS.yellow, label: 'Multi-Ball' },
  LASER: { code: 'L', color: NEON_COLORS.magenta, label: 'Laser Grid' },
  EXPAND: { code: 'E', color: NEON_COLORS.cyan, label: 'Extend Paddle' },
  SLOW: { code: 'S', color: NEON_COLORS.green, label: 'Decelerate' }
};

// --- Particles System ---
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = 2 + Math.random() * 4;
    this.color = color;
    this.alpha = 1.0;
    this.decay = 0.015 + Math.random() * 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05; // Subtle gravity
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Ball Entity ---
class Ball {
  constructor(x, y, speed = 6) {
    this.x = x;
    this.y = y;
    this.radius = 7;
    this.speed = speed;
    this.vx = 0;
    this.vy = 0;
    this.isStuck = true;
    this.trail = [];
    this.maxTrailLength = 8;
  }

  launch() {
    if (this.isStuck) {
      this.isStuck = false;
      // Launch slightly upwards and randomly left/right
      const angle = -Math.PI / 4 - Math.random() * (Math.PI / 2); // between -45 and -135 degrees
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;
      return true;
    }
    return false;
  }

  update() {
    if (this.isStuck) return;

    // Track trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Move ball
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    // Draw neon trail
    for (let i = 0; i < this.trail.length; i++) {
      const pos = this.trail[i];
      const alpha = (i + 1) / this.trail.length * 0.35;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 8;
      ctx.shadowColor = NEON_COLORS.cyan;
      ctx.fillStyle = NEON_COLORS.cyan;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, this.radius * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw main ball
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = NEON_COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// --- Paddle Entity ---
class Paddle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseWidth = 110;
    this.width = this.baseWidth;
    this.height = 14;
    this.targetX = x;
    this.speed = 10;
  }

  update(canvasWidth) {
    // Smoothly interpolate to targetX (which tracks mouse/keys)
    const easing = 0.25;
    this.x += (this.targetX - this.x) * easing;

    // Constrain paddle inside canvas bounds
    const halfW = this.width / 2;
    if (this.x - halfW < 0) {
      this.x = halfW;
      this.targetX = halfW;
    }
    if (this.x + halfW > canvasWidth) {
      this.x = canvasWidth - halfW;
      this.targetX = canvasWidth - halfW;
    }
  }

  draw(ctx, laserActive) {
    const halfW = this.width / 2;
    const xLeft = this.x - halfW;
    const yTop = this.y - this.height / 2;

    ctx.save();
    // Glassmorphism body with glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = NEON_COLORS.cyan;
    ctx.fillStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.strokeStyle = NEON_COLORS.cyan;
    ctx.lineWidth = 2;

    // Rounded rectangle paddle
    ctx.beginPath();
    ctx.roundRect(xLeft, yTop, this.width, this.height, 6);
    ctx.fill();
    ctx.stroke();

    // Side thruster glows
    ctx.fillStyle = NEON_COLORS.cyan;
    ctx.fillRect(xLeft, yTop + 2, 4, this.height - 4);
    ctx.fillRect(xLeft + this.width - 4, yTop + 2, 4, this.height - 4);

    // If lasers are active, draw neon laser barrels
    if (laserActive) {
      ctx.fillStyle = NEON_COLORS.magenta;
      ctx.shadowColor = NEON_COLORS.magenta;
      ctx.fillRect(xLeft + 5, yTop - 6, 6, 8);
      ctx.fillRect(xLeft + this.width - 11, yTop - 6, 6, 8);
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(xLeft + 5, yTop - 6, 6, 8);
      ctx.strokeRect(xLeft + this.width - 11, yTop - 6, 6, 8);
    }
    ctx.restore();
  }
}

// --- Brick Entity ---
class Brick {
  constructor(col, row, typeCode, x, y, w, h) {
    this.col = col;
    this.row = row;
    this.type = typeCode;
    const meta = BRICK_TYPES[typeCode];
    this.hitsLeft = meta.hits;
    this.maxHits = meta.hits;
    this.color = meta.color;
    this.points = meta.pts;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.destroyed = false;
    this.pulseFactor = 0;
  }

  hit() {
    if (this.type === 5) {
      // Indestructible
      return { destroyed: false, points: 0, explosive: false };
    }

    this.hitsLeft--;
    if (this.hitsLeft <= 0) {
      this.destroyed = true;
      return { destroyed: true, points: this.points, explosive: this.type === 4 };
    }

    // Double/Steel bricks crack visually
    return { destroyed: false, points: 50, explosive: false };
  }

  draw(ctx, time) {
    if (this.destroyed) return;

    ctx.save();
    ctx.lineWidth = 1.5;
    
    // Normal / multi-hit glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    
    let fillStyle = 'rgba(0, 0, 0, 0.4)';
    let strokeStyle = this.color;

    // Visual styles based on brick type/damage
    if (this.type === 5) {
      // Indestructible block: Steel cross pattern with white glow
      fillStyle = 'rgba(100, 100, 100, 0.3)';
      strokeStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
    } else if (this.type === 4) {
      // Explosive: pulsating hazard pattern
      const pulse = Math.sin(time * 0.01) * 0.4 + 0.6;
      fillStyle = `rgba(255, 0, 127, ${0.15 + pulse * 0.25})`;
      strokeStyle = NEON_COLORS.magenta;
      ctx.shadowBlur = 10 + pulse * 6;
      ctx.shadowColor = NEON_COLORS.magenta;
    } else {
      // Damaged states
      const integrity = this.hitsLeft / this.maxHits;
      fillStyle = this.color.replace(')', `, ${0.15 + integrity * 0.2})`).replace('#', 'rgba(');
      // Simple HEX to RGBA conversion for standard colors
      if (this.color === NEON_COLORS.cyan) fillStyle = `rgba(0, 242, 254, ${0.15 + integrity * 0.2})`;
      if (this.color === NEON_COLORS.orange) fillStyle = `rgba(255, 107, 0, ${0.15 + integrity * 0.2})`;
      if (this.color === NEON_COLORS.purple) fillStyle = `rgba(157, 78, 221, ${0.15 + integrity * 0.2})`;
    }

    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    
    // Rounded brick shape
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.w, this.h, 4);
    ctx.fill();
    ctx.stroke();

    // Draw internal damage lines/cracks
    if (this.maxHits > 1 && this.hitsLeft < this.maxHits && this.type !== 5) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
      
      // Generate deterministic cracks based on brick position
      const seed = (this.col * 7 + this.row * 13);
      if (this.hitsLeft === 1) {
        // More cracked
        ctx.moveTo(this.x + 5, this.y + this.h / 2);
        ctx.lineTo(this.x + this.w - 5, this.y + this.h / 2);
        ctx.moveTo(this.x + this.w / 2, this.y + 3);
        ctx.lineTo(this.x + this.w / 2 - 8, this.y + this.h - 3);
      } else {
        // Single crack
        ctx.moveTo(this.x + this.w / 3, this.y + 3);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h - 5);
      }
      ctx.stroke();
    }

    // Draw reflective sheen
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.moveTo(this.x + 3, this.y + 3);
    ctx.lineTo(this.x + this.w - 3, this.y + 3);
    ctx.stroke();

    ctx.restore();
  }
}

// --- PowerUp Entity ---
class PowerUp {
  constructor(x, y, typeKey) {
    this.x = x;
    this.y = y;
    this.type = typeKey;
    this.size = 14;
    this.vy = 2.2;
    this.label = POWERUP_TYPES[typeKey].code;
    this.color = POWERUP_TYPES[typeKey].color;
    this.angle = 0;
  }

  update() {
    this.y += this.vy;
    this.angle += 0.05;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;

    // Draw octagon container
    ctx.beginPath();
    const sides = 8;
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const px = Math.cos(angle) * this.size;
      const py = Math.sin(angle) * this.size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw letter symbol inside
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Undo rotation for font so it remains readable
    ctx.rotate(-this.angle);
    ctx.fillText(this.label, 0, 1);

    ctx.restore();
  }
}

// --- Laser Entity ---
class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 3;
    this.h = 16;
    this.vy = -8.5;
  }

  update() {
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = NEON_COLORS.magenta;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x - this.w / 2, this.y, this.w, this.h);
    
    ctx.fillStyle = NEON_COLORS.magenta;
    ctx.fillRect(this.x - this.w / 2 - 1, this.y + 3, this.w + 2, this.h - 6);
    ctx.restore();
  }
}

// --- Game Engine Class ---
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Scale for high density screens (Retina)
    this.logicalWidth = 800;
    this.logicalHeight = 600;
    this.setupHDScale();

    // Game Elements
    this.paddle = new Paddle(this.logicalWidth / 2, this.logicalHeight - 40);
    this.balls = [];
    this.bricks = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];

    // State Variables
    this.score = 0;
    this.highScores = [];
    this.level = 1;
    this.lives = 3;
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, LEVEL_CLEAR, GAME_OVER
    this.isMuted = false;
    this.frameTime = 0;

    // Dynamic Powerup timers
    this.powerupTimers = {
      LASER: 0,
      EXPAND: 0,
      SLOW: 0
    };

    // Screen Shake variables
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Predefined Level Arrays (12 columns wide)
    this.levelLayouts = [
      // Level 1: Simple waves and training grid
      [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 4, 1, 1, 1, 1, 1, 1, 4, 1, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
      ],
      // Level 2: Shield pillars protecting explosive cores
      [
        [5, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 5],
        [5, 0, 4, 3, 3, 0, 0, 3, 3, 4, 0, 5],
        [0, 1, 1, 0, 0, 4, 4, 0, 0, 1, 1, 0],
        [0, 2, 2, 2, 5, 0, 0, 5, 2, 2, 2, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0]
      ],
      // Level 3: Space Invader pattern
      [
        [0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0],
        [0, 0, 0, 3, 0, 4, 4, 0, 3, 0, 0, 0],
        [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
        [0, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 0],
        [1, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1]
      ],
      // Level 4: Quantum Diamond/Pyramid
      [
        [0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 3, 4, 4, 3, 0, 0, 0, 0],
        [0, 0, 0, 2, 2, 1, 1, 2, 2, 0, 0, 0],
        [0, 0, 3, 4, 5, 1, 1, 5, 4, 3, 0, 0],
        [0, 1, 2, 3, 4, 1, 1, 4, 3, 2, 1, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ]
    ];

    this.registerInputEvents();
    this.loadHighScores();
  }

  setupHDScale() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // Set actual pixel dimensions
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // Scale drawing context to match logical pixels
    this.ctx.scale(dpr, dpr);
  }

  initLevel(levelNum) {
    this.level = levelNum;
    this.balls = [new Ball(this.logicalWidth / 2, this.logicalHeight - 55)];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    
    // Reset powerup timers
    this.powerupTimers.LASER = 0;
    this.powerupTimers.EXPAND = 0;
    this.powerupTimers.SLOW = 0;
    this.paddle.width = this.paddle.baseWidth;

    // Rendered bricks layout
    this.bricks = [];
    const layout = this.levelLayouts[(levelNum - 1) % this.levelLayouts.length];
    
    const rows = layout.length;
    const cols = layout[0].length;
    
    const brickW = 58;
    const brickH = 22;
    const gap = 6;
    // Compute starting offset to center the block matrix grid
    const totalW = cols * (brickW + gap) - gap;
    const startX = (this.logicalWidth - totalW) / 2;
    const startY = 65;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = layout[r][c];
        if (val > 0) {
          const bx = startX + c * (brickW + gap);
          const by = startY + r * (brickH + gap);
          this.bricks.push(new Brick(c, r, val, bx, by, brickW, brickH));
        }
      }
    }
  }

  registerInputEvents() {
    // Tracking Mouse
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Account for CSS scaling and scaling factors
      const scaleX = this.logicalWidth / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      this.paddle.targetX = mouseX;
    });

    this.canvas.addEventListener('click', () => {
      this.handlePrimaryAction();
    });

    // Tracking Keyboard
    window.addEventListener('keydown', (e) => {
      const step = 25;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.paddle.targetX -= step;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.paddle.targetX += step;
      }
      if (e.key === ' ') {
        e.preventDefault(); // Stop space page scrolling
        this.handlePrimaryAction();
      }
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        this.togglePause();
      }
    });

    // Sound toggle buttons
    const st = document.getElementById('soundToggle');
    st.addEventListener('click', (e) => {
      e.stopPropagation();
      const muted = sounds.toggleMute();
      st.innerHTML = muted ? '🔇' : '🔊';
      st.style.color = muted ? 'rgba(240,240,255,0.2)' : 'var(--neon-cyan)';
    });

    // Start Screen Button
    document.getElementById('startBtn').addEventListener('click', () => {
      sounds.init();
      this.startGame();
    });

    // Resume Screen Buttons
    document.getElementById('resumeBtn').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('restartPauseBtn').addEventListener('click', () => {
      this.togglePause();
      this.resetGame();
    });

    // Next Level Button
    document.getElementById('nextLevelBtn').addEventListener('click', () => {
      this.loadNextLevel();
    });

    // Game Over Restart Button
    document.getElementById('restartBtn').addEventListener('click', () => {
      this.resetGame();
    });

    // Window Resize Handling to fix layout/scaling issues
    window.addEventListener('resize', () => {
      this.setupHDScale();
    });
  }

  handlePrimaryAction() {
    if (this.state === 'PLAYING') {
      // 1. Launch stuck balls
      let launched = false;
      this.balls.forEach(b => {
        if (b.isStuck) {
          const l = b.launch();
          if (l) launched = true;
        }
      });

      if (launched) {
        sounds.playPaddleHit();
        return;
      }

      // 2. Fire lasers if active
      if (this.powerupTimers.LASER > 0) {
        const halfW = this.paddle.width / 2;
        const leftX = this.paddle.x - halfW + 8;
        const rightX = this.paddle.x + halfW - 8;
        const laserY = this.paddle.y - 10;
        
        this.lasers.push(new Laser(leftX, laserY));
        this.lasers.push(new Laser(rightX, laserY));
        
        sounds.playLaser();
      }
    }
  }

  startGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.initLevel(this.level);
    this.state = 'PLAYING';
    
    document.getElementById('startScreen').classList.add('hidden');
    this.updateHUD();
  }

  resetGame() {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.initLevel(this.level);
    this.state = 'PLAYING';
    
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    this.updateHUD();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pauseScreen').classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pauseScreen').classList.add('hidden');
    }
  }

  loadNextLevel() {
    this.level++;
    this.initLevel(this.level);
    this.state = 'PLAYING';
    document.getElementById('levelClearScreen').classList.add('hidden');
    this.updateHUD();
  }

  triggerGameOver() {
    this.state = 'GAME_OVER';
    sounds.playGameOver();
    this.saveScore(this.score);
    this.displayHighScores();
    document.getElementById('gameOverScreen').classList.remove('hidden');
  }

  triggerLevelClear() {
    this.state = 'LEVEL_CLEAR';
    sounds.playLevelClear();
    document.getElementById('levelClearScreen').classList.remove('hidden');
  }

  loseLife() {
    this.lives--;
    this.updateHUD();
    this.triggerScreenShake(20, 8);
    sounds.playLostLife();

    // Reset powerups on life loss
    this.powerupTimers.LASER = 0;
    this.powerupTimers.EXPAND = 0;
    this.powerupTimers.SLOW = 0;
    this.paddle.width = this.paddle.baseWidth;

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      // Put a single new stuck ball back on the paddle
      this.balls = [new Ball(this.paddle.x, this.logicalHeight - 55)];
    }
  }

  triggerScreenShake(duration, intensity) {
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
  }

  applyScreenShake() {
    if (this.shakeDuration > 0) {
      const dx = (Math.random() * 2 - 1) * this.shakeIntensity;
      const dy = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.ctx.translate(dx, dy);
      this.shakeDuration--;
    }
  }

  spawnPowerUp(x, y) {
    const r = Math.random();
    if (r < 0.20) { // 20% drop rate
      const options = Object.keys(POWERUP_TYPES);
      const chosenType = options[Math.floor(Math.random() * options.length)];
      this.powerups.push(new PowerUp(x, y, chosenType));
    }
  }

  activatePowerUp(type) {
    sounds.playPowerup();
    
    if (type === 'MULTIBALL') {
      // Duplicate all existing balls, max out around 9 balls total
      const activeCount = this.balls.length;
      if (activeCount < 9) {
        const toAdd = [];
        this.balls.forEach(b => {
          if (!b.isStuck) {
            // Spawn 2 new balls with slight offsets in velocity
            const ball1 = new Ball(b.x, b.y, b.speed);
            ball1.isStuck = false;
            ball1.vx = b.vx * Math.cos(0.25) - b.vy * Math.sin(0.25);
            ball1.vy = b.vx * Math.sin(0.25) + b.vy * Math.cos(0.25);

            const ball2 = new Ball(b.x, b.y, b.speed);
            ball2.isStuck = false;
            ball2.vx = b.vx * Math.cos(-0.25) - b.vy * Math.sin(-0.25);
            ball2.vy = b.vx * Math.sin(-0.25) + b.vy * Math.cos(-0.25);

            toAdd.push(ball1, ball2);
          }
        });
        
        if (toAdd.length === 0) {
          // If ball was stuck, just launch a second free ball
          const b = this.balls[0];
          const ball1 = new Ball(b.x, b.y - 10, b.speed);
          ball1.isStuck = false;
          ball1.vx = -3;
          ball1.vy = -5;
          toAdd.push(ball1);
        }

        this.balls.push(...toAdd);
      }
    } else if (type === 'EXPAND') {
      this.paddle.width = this.paddle.baseWidth * 1.5;
      this.powerupTimers.EXPAND = 600; // ~10 seconds at 60fps
    } else if (type === 'LASER') {
      this.powerupTimers.LASER = 480; // ~8 seconds
    } else if (type === 'SLOW') {
      this.powerupTimers.SLOW = 480; // ~8 seconds
      // Apply decelerating speed immediately to active balls
      this.balls.forEach(b => {
        b.speed = 3.5;
        // Normalize speed
        const currentMag = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (currentMag > 0) {
          b.vx = (b.vx / currentMag) * b.speed;
          b.vy = (b.vy / currentMag) * b.speed;
        }
      });
    }
  }

  // Chain reaction for explosive brick type
  explodeBrick(brick) {
    this.triggerScreenShake(15, 6);
    sounds.playBrickExplosive();
    
    // Spawn extra explosions particles
    for (let i = 0; i < 30; i++) {
      this.particles.push(new Particle(brick.x + brick.w / 2, brick.y + brick.h / 2, NEON_COLORS.magenta));
    }

    // Explosion radius check (adjacent columns and rows)
    const checkRadius = 1.8; // Grid row/col distance check
    
    this.bricks.forEach(b => {
      if (!b.destroyed && b !== brick) {
        const distC = Math.abs(b.col - brick.col);
        const distR = Math.abs(b.row - brick.row);
        
        if (distC <= 1.2 && distR <= 1.2) {
          const res = b.hit();
          if (res.points > 0) {
            this.score += res.points;
            
            // Add particles
            for (let i = 0; i < 8; i++) {
              this.particles.push(new Particle(b.x + b.w / 2, b.y + b.h / 2, b.color));
            }

            if (res.destroyed) {
              this.spawnPowerUp(b.x + b.w / 2, b.y + b.h / 2);
              if (res.explosive) {
                // Delay explosion slightly to look cool in cascade chain
                setTimeout(() => this.explodeBrick(b), 120);
              }
            }
          }
        }
      }
    });

    this.updateHUD();
  }

  // Core Physics and Update Calculations
  update(time) {
    this.frameTime = time;

    if (this.state !== 'PLAYING') return;

    // Update active powerup timers
    Object.keys(this.powerupTimers).forEach(key => {
      if (this.powerupTimers[key] > 0) {
        this.powerupTimers[key]--;
        
        // Expiration callbacks
        if (this.powerupTimers[key] === 0) {
          if (key === 'EXPAND') {
            this.paddle.width = this.paddle.baseWidth;
          } else if (key === 'SLOW') {
            // Restore normal speed to all balls
            this.balls.forEach(b => {
              b.speed = 6.0;
              const currentMag = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
              if (currentMag > 0) {
                b.vx = (b.vx / currentMag) * b.speed;
                b.vy = (b.vy / currentMag) * b.speed;
              }
            });
          }
        }
      }
    });
    this.updatePowerupPills();

    // Update Paddle
    this.paddle.update(this.logicalWidth);

    // Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.update();
      
      // Screen exit check
      if (laser.y < 0) {
        this.lasers.splice(i, 1);
        continue;
      }

      // Check laser collisions with Bricks
      let hitRegistered = false;
      for (let j = 0; j < this.bricks.length; j++) {
        const brick = this.bricks[j];
        if (!brick.destroyed && brick.type !== 5) {
          // AABB check
          if (laser.x >= brick.x && laser.x <= brick.x + brick.w &&
              laser.y >= brick.y && laser.y <= brick.y + brick.h) {
            
            const res = brick.hit();
            this.score += res.points;
            this.updateHUD();

            // Spark effects
            for (let p = 0; p < 8; p++) {
              this.particles.push(new Particle(laser.x, laser.y, brick.color));
            }

            if (res.destroyed) {
              if (res.explosive) this.explodeBrick(brick);
              else {
                sounds.playBrickNormal();
                this.spawnPowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2);
              }
            } else {
              sounds.playBrickHard();
            }

            hitRegistered = true;
            break;
          }
        }
      }

      if (hitRegistered) {
        this.lasers.splice(i, 1);
      }
    }

    // Update Balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      
      if (ball.isStuck) {
        // Keep ball on top center of paddle
        ball.x = this.paddle.x;
        ball.y = this.paddle.y - this.paddle.height / 2 - ball.radius;
        continue;
      }

      ball.update();

      // --- Collisions: Wall boundaries ---
      // Left and Right walls
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx;
        sounds.playTone(450, 450, 0.05, 'sine', 0.05);
      } else if (ball.x + ball.radius >= this.logicalWidth) {
        ball.x = this.logicalWidth - ball.radius;
        ball.vx = -ball.vx;
        sounds.playTone(450, 450, 0.05, 'sine', 0.05);
      }

      // Ceiling wall
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = -ball.vy;
        sounds.playTone(450, 450, 0.05, 'sine', 0.05);
      }

      // Bottom gutter (Lose ball)
      if (ball.y - ball.radius >= this.logicalHeight) {
        this.balls.splice(i, 1);
        
        // If all balls are lost, lose a life
        if (this.balls.length === 0) {
          this.loseLife();
          break;
        }
        continue;
      }

      // --- Collisions: Paddle deflection ---
      const halfPW = this.paddle.width / 2;
      const pHalfH = this.paddle.height / 2;

      // Ball AABB overlapping with paddle
      if (ball.y + ball.radius >= this.paddle.y - pHalfH &&
          ball.y - ball.radius <= this.paddle.y + pHalfH &&
          ball.x + ball.radius >= this.paddle.x - halfPW &&
          ball.x - ball.radius <= this.paddle.x + halfPW) {
        
        // Reverse vertical direction only if falling downwards
        if (ball.vy > 0) {
          ball.y = this.paddle.y - pHalfH - ball.radius;
          
          // Deflection math: angle scales depending on distance from paddle center
          const distFromCenter = ball.x - this.paddle.x;
          const normalizedDist = distFromCenter / halfPW; // between -1 and 1
          
          const maxDeflectionAngle = Math.PI / 3; // Max 60 degrees deflection
          const angle = -Math.PI / 2 + normalizedDist * maxDeflectionAngle;
          
          ball.vx = Math.cos(angle) * ball.speed;
          ball.vy = Math.sin(angle) * ball.speed;

          sounds.playPaddleHit();
        }
      }

      // --- Collisions: Bricks matrix ---
      for (let j = 0; j < this.bricks.length; j++) {
        const brick = this.bricks[j];
        if (brick.destroyed) continue;

        // AABB vs. circle bounding box test
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
        
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distSq = distX * distX + distY * distY;

        if (distSq < ball.radius * ball.radius) {
          // Collision registered! Evaluate brick damage
          const res = brick.hit();
          
          if (res.points > 0) {
            this.score += res.points;
            this.updateHUD();
          }

          // Spawn glow particles
          const sparkCount = brick.type === 5 ? 5 : 12;
          for (let p = 0; p < sparkCount; p++) {
            this.particles.push(new Particle(closestX, closestY, brick.color));
          }

          if (res.destroyed) {
            if (res.explosive) {
              this.explodeBrick(brick);
            } else {
              sounds.playBrickNormal();
              this.spawnPowerUp(brick.x + brick.w / 2, brick.y + brick.h / 2);
            }
          } else {
            // Metallic tone for steel/undestructible bounce
            sounds.playBrickHard();
          }

          // Bounce math reflection: Determine side of impact
          // 1. Closest hit is on horizontal or vertical edge
          const overlapX = ball.radius - Math.abs(distX);
          const overlapY = ball.radius - Math.abs(distY);

          if (overlapX < overlapY) {
            // Left/Right side bounce
            ball.vx = distX > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
            ball.x += distX > 0 ? overlapX : -overlapX;
          } else {
            // Top/Bottom side bounce
            ball.vy = distY > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
            ball.y += distY > 0 ? overlapY : -overlapY;
          }

          break; // Stop evaluating further brick collisions in this tick
        }
      }
    }

    // Level progression validation check
    const remainingDestructibleBricks = this.bricks.filter(b => !b.destroyed && b.type !== 5).length;
    if (remainingDestructibleBricks === 0) {
      this.triggerLevelClear();
    }

    // Update Dropping Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.update();

      // Screen exit boundary
      if (pu.y > this.logicalHeight) {
        this.powerups.splice(i, 1);
        continue;
      }

      // Collect power-up collision check
      const halfPW = this.paddle.width / 2;
      const pHalfH = this.paddle.height / 2;
      
      if (pu.y + pu.size >= this.paddle.y - pHalfH &&
          pu.y - pu.size <= this.paddle.y + pHalfH &&
          pu.x + pu.size >= this.paddle.x - halfPW &&
          pu.x - pu.size <= this.paddle.x + halfPW) {
        
        this.activatePowerUp(pu.type);
        this.powerups.splice(i, 1);
      }
    }

    // Update active particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // UI Layer Rendering
  draw() {
    this.ctx.save();
    
    // Clear screen
    this.ctx.fillStyle = '#05050c';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Apply shake translation
    this.applyScreenShake();

    // Subtle background lines/matrix grid
    this.ctx.strokeStyle = 'rgba(18, 18, 40, 0.2)';
    this.ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < this.logicalWidth; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.logicalHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.logicalHeight; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.logicalWidth, y);
      this.ctx.stroke();
    }

    // Draw level bricks
    this.bricks.forEach(brick => brick.draw(this.ctx, this.frameTime));

    // Draw active powerups falling
    this.powerups.forEach(pu => pu.draw(this.ctx));

    // Draw active laser bullets
    this.lasers.forEach(l => l.draw(this.ctx));

    // Draw active balls
    this.balls.forEach(ball => ball.draw(this.ctx));

    // Draw Paddle
    this.paddle.draw(this.ctx, this.powerupTimers.LASER > 0);

    // Draw particle sparks
    this.particles.forEach(p => p.draw(this.ctx));

    this.ctx.restore();
  }

  updateHUD() {
    const formatScore = (num) => String(num).padStart(6, '0');
    
    document.getElementById('scoreVal').innerText = formatScore(this.score);
    document.getElementById('levelVal').innerText = this.level;
    document.getElementById('highScoreVal').innerText = formatScore(this.getHighScore());

    // Hearts represent lives
    const heartVal = '❤'.repeat(Math.max(0, this.lives));
    const livesDiv = document.getElementById('livesVal');
    livesDiv.innerText = heartVal || '☠';
    
    if (this.lives === 1) {
      livesDiv.className = 'hud-value magenta'; // Red warning
    } else {
      livesDiv.className = 'hud-value green';
    }
  }

  updatePowerupPills() {
    const container = document.getElementById('activePowerups');
    container.innerHTML = ''; // Reset active elements

    Object.keys(this.powerupTimers).forEach(key => {
      const ticks = this.powerupTimers[key];
      if (ticks > 0) {
        const meta = POWERUP_TYPES[key];
        const sRemaining = Math.ceil(ticks / 60);

        const pill = document.createElement('div');
        pill.className = `powerup-pill ${key.toLowerCase()}`;
        pill.innerHTML = `<span>${meta.label} (${sRemaining}s)</span>`;
        container.appendChild(pill);
      }
    });
  }

  // High Scores Operations
  loadHighScores() {
    const raw = localStorage.getItem('neon_brick_breaker_highscores');
    if (raw) {
      try {
        this.highScores = JSON.parse(raw);
      } catch (e) {
        this.highScores = [];
      }
    }
    
    // Seed default cyberpunk high scores if empty
    if (this.highScores.length === 0) {
      this.highScores = [
        { name: 'K4YS3R', score: 12000 },
        { name: 'N30N_R1D3R', score: 8500 },
        { name: 'CYB3R_PUNK', score: 5000 },
        { name: 'M4TR1X', score: 3000 },
        { name: 'G3M1N1', score: 1000 }
      ];
      this.saveScoresToStorage();
    }
  }

  saveScoresToStorage() {
    localStorage.setItem('neon_brick_breaker_highscores', JSON.stringify(this.highScores));
  }

  getHighScore() {
    return this.highScores.length > 0 ? this.highScores[0].score : 0;
  }

  saveScore(newScore) {
    const name = 'YOU'; // Default name label
    this.highScores.push({ name, score: newScore });
    
    // Sort scores descending, slice top 5
    this.highScores.sort((a, b) => b.score - a.score);
    this.highScores = this.highScores.slice(0, 5);
    this.saveScoresToStorage();
  }

  displayHighScores() {
    const list = document.getElementById('highScoresContainer');
    list.innerHTML = ''; // Clear

    this.highScores.forEach(entry => {
      const row = document.createElement('div');
      row.className = `score-row ${entry.name === 'YOU' ? 'current' : ''}`;
      row.innerHTML = `<span>${entry.name}</span> <span>${entry.score}</span>`;
      list.appendChild(row);
    });
  }
}

// Instantiate and launch core loop on page load
window.addEventListener('DOMContentLoaded', () => {
  const engine = new GameEngine();

  // Core RequestAnimationFrame loop
  function loop(timestamp) {
    engine.update(timestamp);
    engine.draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
