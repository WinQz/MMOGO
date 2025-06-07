export class LoadingScreen {
    constructor() {
        this.loadingStartTime = Date.now();
        this.minimumLoadingTime = 4000;
        this.loadingTips = [
            "🗡️ Use WASD or arrow keys to move your character around the world",
            "💬 Press Enter to open chat and communicate with other players",
            "🎯 Click on nearby players to interact with them and view their stats",
            "🏃 Stay close to other players to unlock interaction options",
            "⚔️ Trade items and make friends in this medieval world",
            "🛡️ Your character automatically saves progress as you play",
            "🌍 Explore the vast world and discover hidden secrets",
            "👥 Join guilds and form alliances with other adventurers",
            "💰 Collect gold and valuable items on your journey",
            "🔮 Master different skills to become a legendary hero",
            "🏰 Visit towns and cities to trade with merchants",
            "🐉 Beware of dangerous creatures lurking in dark corners",
            "📜 Complete quests to gain experience and rewards",
            "⭐ Level up your character to unlock new abilities",
            "🎭 Customize your character's appearance and equipment",
            "🏃‍♂️ Hold SHIFT to sprint faster, but watch your stamina!"
        ];
        this.currentTip = this.getRandomTip();
        this.tipChangeInterval = 2000;
        this.lastTipChange = Date.now();
    }
    
    show() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'medievalLoadingScreen';
        loadingScreen.innerHTML = `
            <div class="loading-background">
                <div class="magic-particles"></div>
                <div class="loading-content">
                    <div class="loading-logo">
                        <div class="logo-frame">
                            <div class="corner-gem top-left">💎</div>
                            <div class="corner-gem top-right">💎</div>
                            <div class="corner-gem bottom-left">💎</div>
                            <div class="corner-gem bottom-right">💎</div>
                            <h1 class="game-title">⚔️ MEDIEVAL REALM ⚔️</h1>
                            <p class="game-subtitle">Enter the World of Adventure</p>
                        </div>
                    </div>
                    
                    <div class="loading-bar-container">
                        <div class="loading-bar-frame">
                            <div class="loading-bar-background">
                                <div class="loading-bar-fill" id="loadingBarFill"></div>
                                <div class="loading-bar-shine"></div>
                            </div>
                        </div>
                        <div class="loading-percentage" id="loadingPercentage">0%</div>
                    </div>
                    
                    <div class="loading-status" id="loadingStatus">
                        <span class="status-icon">🏰</span>
                        <span class="status-text">Entering the realm...</span>
                    </div>
                    
                    <div class="tips-container">
                        <div class="tips-frame">
                            <h3 class="tips-title">
                                <span class="tips-icon">📜</span>
                                Adventurer's Tips
                            </h3>
                            <div class="tip-content" id="loadingTip">
                                ${this.currentTip}
                            </div>
                        </div>
                    </div>
                    
                    <div class="loading-footer">
                        <p>Powered by Medieval Magic ✨</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingScreen);
        this.startLoadingAnimations();
        this.createMagicParticles();
    }
    
    startLoadingAnimations() {
        const statusSteps = [
            { icon: "🏰", text: "Entering the realm...", duration: 800 },
            { icon: "⚔️", text: "Forging your destiny...", duration: 1000 },
            { icon: "🛡️", text: "Preparing your adventure...", duration: 800 },
            { icon: "🗺️", text: "Loading the world...", duration: 900 },
            { icon: "👑", text: "Almost ready, brave warrior!", duration: 500 }
        ];
        
        let currentStep = 0;
        let progress = 0;
        const totalSteps = statusSteps.length;
        
        const updateLoading = () => {
            const elapsedTime = Date.now() - this.loadingStartTime;
            const naturalProgress = Math.min(80, (elapsedTime / this.minimumLoadingTime) * 100);
            
            if (currentStep < totalSteps) {
                const step = statusSteps[currentStep];
                
                const statusEl = document.getElementById('loadingStatus');
                if (statusEl) {
                    statusEl.innerHTML = `
                        <span class="status-icon">${step.icon}</span>
                        <span class="status-text">${step.text}</span>
                    `;
                }
                
                setTimeout(() => {
                    currentStep++;
                    if (currentStep < totalSteps) {
                        requestAnimationFrame(updateLoading);
                    }
                }, step.duration);
                
                progress = Math.min(90, (currentStep / totalSteps) * 100);
            }
            
            const displayProgress = Math.max(naturalProgress, progress);
            const barFill = document.getElementById('loadingBarFill');
            const percentage = document.getElementById('loadingPercentage');
            
            if (barFill) barFill.style.width = `${displayProgress}%`;
            if (percentage) percentage.textContent = `${Math.floor(displayProgress)}%`;
            
            this.updateLoadingTip();
            
            if (elapsedTime >= this.minimumLoadingTime && currentStep >= totalSteps) {
                if (barFill) barFill.style.width = '100%';
                if (percentage) percentage.textContent = '100%';
            } else if (currentStep < totalSteps || elapsedTime < this.minimumLoadingTime) {
                requestAnimationFrame(updateLoading);
            }
        };
        
        requestAnimationFrame(updateLoading);
    }
    
    updateLoadingTip() {
        const now = Date.now();
        if (now - this.lastTipChange > this.tipChangeInterval) {
            this.currentTip = this.getRandomTip();
            const tipEl = document.getElementById('loadingTip');
            if (tipEl) {
                tipEl.textContent = this.currentTip;
            }
            this.lastTipChange = now;
        }
    }
    
    getRandomTip() {
        return this.loadingTips[Math.floor(Math.random() * this.loadingTips.length)];
    }
    
    createMagicParticles() {
        const particlesContainer = document.querySelector('.magic-particles');
        if (!particlesContainer) return;
        
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 4 + 's';
            particle.style.animationDuration = (3 + Math.random() * 2) + 's';
            
            const particles = ['✨', '⭐', '🌟', '💫', '🔮', '⚡', '🌙'];
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            
            particlesContainer.appendChild(particle);
        }
    }
    
    hide() {
        const loadingScreen = document.getElementById('medievalLoadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transform = 'scale(1.1)';
            setTimeout(() => {
                loadingScreen.remove();
                
                const gameContainer = document.getElementById('gameContainer');
                if (gameContainer) {
                    gameContainer.style.opacity = '1';
                    gameContainer.style.transform = 'scale(1)';
                }
            }, 800);
        }
    }
}
