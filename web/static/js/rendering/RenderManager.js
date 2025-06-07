export class RenderManager {
    constructor(canvas, ctx, gameClient) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gameClient = gameClient;
        this.windParticles = [];
        this.interpolationFactor = 0.15;
    }
    
    setupCanvas() {
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        if (!this.canvas) return;
        
        const topHUD = document.getElementById('topHUD');
        const hudHeight = topHUD ? topHUD.offsetHeight : 80;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - hudHeight;
        
        this.canvas.style.width = '100vw';
        this.canvas.style.height = `calc(100vh - ${hudHeight}px)`;
    }
    
    render() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Update and draw wind particles
        this.updateWindParticles();
        this.drawWindParticles();
        
        // Draw all players
        const players = this.gameClient.getPlayerManager().getAllPlayers();
        players.forEach(player => {
            this.drawPlayer(player);
            
            // Create sprint particles for any sprinting player
            if (player.sprinting) {
                this.createSprintParticles(player.x, player.y);
            }
        });
    }
    
    drawGrid() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 100;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawPlayer(player) {
        if (!this.ctx) return;
        
        const radius = 20;
        const myPlayer = this.gameClient.getMyPlayer();
        
        // Draw shadow
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x + 2, player.y + 2, radius + 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Draw interaction hint if nearby (green dashed circle)
        if (player.showInteractionHint) {
            this.ctx.save();
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([8, 4]);
            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, radius + 12, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
            
            // Add pulsing effect
            this.ctx.save();
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 2]);
            this.ctx.globalAlpha = 0.4 + 0.3 * Math.sin(Date.now() * 0.005);
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, radius + 18, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        // Draw sprint effect for any sprinting player
        if (player.sprinting) {
            this.ctx.save();
            this.ctx.strokeStyle = '#87ceeb';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.6;
            this.ctx.setLineDash([4, 2]);
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, radius + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        // Draw main circle
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Highlight own player
        if (myPlayer && player.id === myPlayer.id) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        // Draw name with background
        this.ctx.save();
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        
        const textWidth = this.ctx.measureText(player.name).width;
        const textX = player.x;
        const textY = player.y - radius - 15;
        
        // Name background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(textX - textWidth/2 - 5, textY - 15, textWidth + 10, 20);
        
        // Name text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(player.name, textX, textY - 2);
        this.ctx.restore();
        
        // Draw movement indicator
        if (player.moving) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, radius + 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // Add interaction tooltip if hinted
        if (player.showInteractionHint) {
            this.ctx.save();
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(player.x - 30, player.y + radius + 20, 60, 20);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText('Click to interact', player.x, player.y + radius + 33);
            this.ctx.restore();
        }
    }
    
    createSprintParticles(x, y) {
        // Create wind particles behind any sprinting player
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 10;
            
            this.windParticles.push({
                x: x - Math.cos(angle) * distance,
                y: y - Math.sin(angle) * distance,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0,
                decay: 0.02,
                size: 2 + Math.random() * 3,
                color: `rgba(135, 206, 235, ${0.6 + Math.random() * 0.4})`
            });
        }
        
        if (this.windParticles.length > 100) {
            this.windParticles.splice(0, this.windParticles.length - 100);
        }
    }
    
    updateWindParticles() {
        for (let i = this.windParticles.length - 1; i >= 0; i--) {
            const particle = this.windParticles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                this.windParticles.splice(i, 1);
            }
        }
    }
    
    drawWindParticles() {
        if (!this.ctx) return;
        
        this.ctx.save();
        for (const particle of this.windParticles) {
            this.ctx.globalAlpha = particle.life * 0.8;
            this.ctx.fillStyle = particle.color || '#87ceeb';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
}
