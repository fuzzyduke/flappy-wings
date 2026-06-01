/**
 * Flappy Wings - A Flappy Bird Clone
 * Built with HTML5 Canvas
 */

class FlappyGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 600;

        // UI Elements
        this.startScreen = document.getElementById('startScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.liveScore = document.getElementById('liveScore');
        this.finalScoreEl = document.getElementById('finalScore');
        this.highScoreEl = document.getElementById('highScore');
        this.highScoreStartEl = document.getElementById('highScoreStart');

        // Game state
        this.gameState = 'start'; // 'start', 'playing', 'gameOver'
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;

        // Bird properties
        this.bird = {
            x: 80,
            y: 300,
            width: 40,
            height: 30,
            velocity: 0,
            gravity: 0.5,
            jumpStrength: -9,
            rotation: 0
        };

        // Pipes
        this.pipes = [];
        this.pipeWidth = 70;
        this.pipeGap = 160;
        this.pipeSpeed = 3;
        this.pipeSpawnInterval = 1800;
        this.lastPipeSpawn = 0;

        // Particles
        this.particles = [];

        // Ground
        this.groundY = this.canvas.height - 80;
        this.groundOffset = 0;

        // Colors
        this.colors = {
            sky: ['#87CEEB', '#E0F6FF'],
            ground: '#8B4513',
            grass: '#228B22',
            pipe: '#2ECC71',
            pipeEdge: '#27AE60',
            pipeShadow: '#1E8449',
            bird: '#FFD93D',
            birdWing: '#F4A900',
            birdEye: '#333',
            birdBeak: '#FF6B35'
        };

        // Animation
        this.wingAngle = 0;
        this.frameCount = 0;

        this.init();
    }

    init() {
        this.updateHighScoreDisplay();
        this.bindEvents();
        this.gameLoop();
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        // Touch/Click on canvas
        this.canvas.addEventListener('click', () => this.handleInput());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        });
    }

    handleInput() {
        if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.flap();
        } else if (this.gameState === 'gameOver') {
            // Small delay before allowing restart
            // Handled by button
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.particles = [];
        this.lastPipeSpawn = Date.now();

        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.liveScore.classList.add('visible');
        this.liveScore.textContent = '0';

        // Initial flap
        this.flap();
    }

    flap() {
        this.bird.velocity = this.bird.jumpStrength;
        this.createFlapParticles();
    }

    createFlapParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y + this.bird.height / 2,
                vx: -Math.random() * 2 - 1,
                vy: Math.random() * 2 - 1,
                size: Math.random() * 4 + 2,
                life: 1,
                color: '#fff'
            });
        }
    }

    createScoreParticles() {
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 / 10) * i;
            this.particles.push({
                x: this.bird.x + this.bird.width / 2,
                y: this.bird.y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: Math.random() * 5 + 3,
                life: 1,
                color: '#FFD700'
            });
        }
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.frameCount++;

        // Update bird
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

        // Wing animation
        this.wingAngle = Math.sin(this.frameCount * 0.3) * 20;

        // Spawn pipes
        if (Date.now() - this.lastPipeSpawn > this.pipeSpawnInterval) {
            this.spawnPipe();
            this.lastPipeSpawn = Date.now();
        }

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;

            // Score when passing pipe
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.liveScore.textContent = this.score;
                this.createScoreParticles();
            }

            // Remove off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }

            // Collision detection
            if (this.checkCollision(pipe)) {
                this.gameOver();
                return;
            }
        }

        // Ground collision
        if (this.bird.y + this.bird.height > this.groundY) {
            this.bird.y = this.groundY - this.bird.height;
            this.gameOver();
            return;
        }

        // Ceiling collision
        if (this.bird.y < 0) {
            this.bird.y = 0;
            this.bird.velocity = 0;
        }

        // Update ground scroll
        this.groundOffset = (this.groundOffset + this.pipeSpeed) % 40;

        // Update particles
        this.updateParticles();
    }

    spawnPipe() {
        const minHeight = 80;
        const maxHeight = this.groundY - this.pipeGap - minHeight;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }

    checkCollision(pipe) {
        const birdBox = {
            x: this.bird.x + 5,
            y: this.bird.y + 5,
            width: this.bird.width - 10,
            height: this.bird.height - 10
        };

        // Top pipe
        if (birdBox.x < pipe.x + this.pipeWidth &&
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.y < pipe.topHeight) {
            return true;
        }

        // Bottom pipe
        if (birdBox.x < pipe.x + this.pipeWidth &&
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.y + birdBox.height > pipe.bottomY) {
            return true;
        }

        return false;
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.03;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    gameOver() {
        this.gameState = 'gameOver';
        this.liveScore.classList.remove('visible');

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyHighScore', this.highScore);
        }

        // Show game over screen
        this.finalScoreEl.textContent = this.score;
        this.highScoreEl.textContent = this.highScore;
        this.updateHighScoreDisplay();

        setTimeout(() => {
            this.gameOverScreen.classList.remove('hidden');
        }, 500);
    }

    updateHighScoreDisplay() {
        this.highScoreStartEl.textContent = this.highScore;
    }

    // ===== RENDERING =====

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        this.drawPipes();
        this.drawGround();
        this.drawParticles();
        this.drawBird();
    }

    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.colors.sky[0]);
        gradient.addColorStop(1, this.colors.sky[1]);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Clouds
        this.drawClouds();
    }

    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        // Static clouds (simple decoration)
        const clouds = [
            { x: 50, y: 80, size: 40 },
            { x: 200, y: 120, size: 50 },
            { x: 320, y: 60, size: 35 },
            { x: 100, y: 200, size: 30 }
        ];

        clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - 10, cloud.size * 0.7, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 1.5, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawPipes() {
        this.pipes.forEach(pipe => {
            // Top pipe
            this.drawPipe(pipe.x, 0, this.pipeWidth, pipe.topHeight, true);

            // Bottom pipe
            this.drawPipe(pipe.x, pipe.bottomY, this.pipeWidth, this.groundY - pipe.bottomY, false);
        });
    }

    drawPipe(x, y, width, height, isTop) {
        const capHeight = 30;
        const capOverhang = 6;

        // Main pipe body
        const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
        gradient.addColorStop(0, this.colors.pipeShadow);
        gradient.addColorStop(0.3, this.colors.pipe);
        gradient.addColorStop(0.7, this.colors.pipe);
        gradient.addColorStop(1, this.colors.pipeShadow);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);

        // Pipe cap
        const capY = isTop ? y + height - capHeight : y;

        const capGradient = this.ctx.createLinearGradient(x - capOverhang, 0, x + width + capOverhang, 0);
        capGradient.addColorStop(0, this.colors.pipeShadow);
        capGradient.addColorStop(0.2, this.colors.pipeEdge);
        capGradient.addColorStop(0.8, this.colors.pipeEdge);
        capGradient.addColorStop(1, this.colors.pipeShadow);

        this.ctx.fillStyle = capGradient;
        this.ctx.fillRect(x - capOverhang, capY, width + capOverhang * 2, capHeight);

        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(x + 8, y, 10, height);
    }

    drawGround() {
        // Grass layer
        this.ctx.fillStyle = this.colors.grass;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, 15);

        // Dirt layer
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(0, this.groundY + 15, this.canvas.width, 80);

        // Ground pattern
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        for (let i = -this.groundOffset; i < this.canvas.width + 40; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.groundY + 15);
            this.ctx.lineTo(i + 20, this.groundY + 80);
            this.ctx.stroke();
        }
    }

    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
        this.ctx.rotate(this.bird.rotation * Math.PI / 180);

        const x = -this.bird.width / 2;
        const y = -this.bird.height / 2;

        // Body
        this.ctx.fillStyle = this.colors.bird;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Wing
        this.ctx.save();
        this.ctx.rotate(this.wingAngle * Math.PI / 180);
        this.ctx.fillStyle = this.colors.birdWing;
        this.ctx.beginPath();
        this.ctx.ellipse(-5, 5, 12, 8, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Eye
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(8, -5, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = this.colors.birdEye;
        this.ctx.beginPath();
        this.ctx.arc(10, -5, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye highlight
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(11, -7, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Beak
        this.ctx.fillStyle = this.colors.birdBeak;
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, 3);
        this.ctx.lineTo(15, 8);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    // ===== GAME LOOP =====

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new FlappyGame();
});
