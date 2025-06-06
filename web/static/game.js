class MMORPGClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = null;
        
        // Game state
        this.players = new Map();
        this.npcs = new Map();
        this.items = new Map();
        this.myPlayer = null;
        this.currentUser = null;
        
        // Loading screen
        this.loadingStartTime = Date.now();
        this.minimumLoadingTime = 4000; // 4 seconds minimum
        this.isLoading = true;
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
            "🎭 Customize your character's appearance and equipment"
        ];
        this.currentTip = this.getRandomTip();
        this.tipChangeInterval = 2000; // Change tip every 2 seconds
        this.lastTipChange = Date.now();
        
        // Smooth movement system
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveInterval = 50; // Reduced for smoother movement
        this.interpolationFactor = 0.15; // For smooth player movement
        
        // Player interaction system - improved
        this.nearbyPlayers = new Map();
        this.previousNearbyPlayers = new Map(); // Track previous state
        this.interactionMenu = null;
        this.selectedPlayer = null;
        this.lastNearbyCheck = 0;
        this.nearbyCheckInterval = 1000; // Increased to 1 second
        this.interactionMenuVisible = false;
        this.closeHandler = null; // Track the close handler
        
        // UI elements
        this.statusElement = document.getElementById('status');
        this.nameDisplay = document.getElementById('nameDisplay');
        this.posDisplay = document.getElementById('posDisplay');
        this.chatInput = document.getElementById('chatInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.sendButton = document.getElementById('sendButton');
        this.onlineCountElement = document.getElementById('onlineCount');
        
        this.setupUIHandlers();
        this.showLoadingScreen();
        this.init();
    }
    
    showLoadingScreen() {
        // Create loading screen overlay
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'medievalLoadingScreen';
        loadingScreen.innerHTML = `
            <div class="loading-background">
                <!-- Animated background particles -->
                <div class="magic-particles"></div>
                
                <!-- Main loading content -->
                <div class="loading-content">
                    <!-- Logo/Title -->
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
                    
                    <!-- Loading bar -->
                    <div class="loading-bar-container">
                        <div class="loading-bar-frame">
                            <div class="loading-bar-background">
                                <div class="loading-bar-fill" id="loadingBarFill"></div>
                                <div class="loading-bar-shine"></div>
                            </div>
                        </div>
                        <div class="loading-percentage" id="loadingPercentage">0%</div>
                    </div>
                    
                    <!-- Loading status -->
                    <div class="loading-status" id="loadingStatus">
                        <span class="status-icon">🏰</span>
                        <span class="status-text">Entering the realm...</span>
                    </div>
                    
                    <!-- Tips section -->
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
                    
                    <!-- Footer -->
                    <div class="loading-footer">
                        <p>Powered by Medieval Magic ✨</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loadingScreen);
        
        // Start animations
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
            const elapsed = Date.now() - this.loadingStartTime;
            const minProgress = Math.min((elapsed / this.minimumLoadingTime) * 100, 100);
            
            // Simulate realistic loading progress
            progress = Math.min(progress + Math.random() * 3 + 1, minProgress);
            
            // Update progress bar
            const fillElement = document.getElementById('loadingBarFill');
            const percentageElement = document.getElementById('loadingPercentage');
            
            if (fillElement) {
                fillElement.style.width = `${progress}%`;
            }
            if (percentageElement) {
                percentageElement.textContent = `${Math.floor(progress)}%`;
            }
            
            // Update status
            const statusElement = document.getElementById('loadingStatus');
            if (statusElement && currentStep < totalSteps) {
                const stepProgress = (progress / 100) * totalSteps;
                const newStep = Math.floor(stepProgress);
                
                if (newStep > currentStep) {
                    currentStep = newStep;
                    if (currentStep < totalSteps) {
                        const step = statusSteps[currentStep];
                        statusElement.innerHTML = `
                            <span class="status-icon">${step.icon}</span>
                            <span class="status-text">${step.text}</span>
                        `;
                    }
                }
            }
            
            // Update tips
            this.updateLoadingTip();
            
            // Check if loading is complete
            if (progress >= 100 && elapsed >= this.minimumLoadingTime) {
                this.hideLoadingScreen();
            } else {
                requestAnimationFrame(updateLoading);
            }
        };
        
        requestAnimationFrame(updateLoading);
    }
    
    updateLoadingTip() {
        const now = Date.now();
        if (now - this.lastTipChange > this.tipChangeInterval) {
            this.currentTip = this.getRandomTip();
            const tipElement = document.getElementById('loadingTip');
            if (tipElement) {
                // Fade out
                tipElement.style.opacity = '0';
                tipElement.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    tipElement.textContent = this.currentTip;
                    // Fade in
                    tipElement.style.opacity = '1';
                    tipElement.style.transform = 'translateY(0)';
                }, 300);
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
            
            // Random particle types
            const particles = ['✨', '⭐', '🌟', '💫', '🔮'];
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            
            particlesContainer.appendChild(particle);
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('medievalLoadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                loadingScreen.remove();
                this.isLoading = false;
                // Show the main game interface
                document.getElementById('gameContainer').style.opacity = '1';
                document.getElementById('gameContainer').style.transform = 'scale(1)';
            }, 800);
        }
    }
    
    async init() {
        await this.verifyAuthentication();
        this.setupEventListeners();
        this.connect();
        this.gameLoop();
    }
    
    setupUIHandlers() {
        // Chat minimize/close handlers
        const chatMinimize = document.getElementById('chatMinimize');
        if (chatMinimize) {
            chatMinimize.addEventListener('click', () => {
                document.getElementById('chatPanel').classList.toggle('minimized');
            });
        }
        
        // Send button handler
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }
        
        // Logout button handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // Chat tab handlers
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
    
    async verifyAuthentication() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/auth';
            return;
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = {
                    username: data.username,
                    token: token
                };
                if (this.nameDisplay) {
                    this.nameDisplay.textContent = data.username;
                }
                this.updateStatus('Authenticated as ' + data.username, 'green');
            } else {
                localStorage.removeItem('authToken');
                window.location.href = '/auth';
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            window.location.href = '/auth';
        }
    }
    
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            this.updateStatus('Connected', 'green');
            this.joinGame();
        };
        
        this.socket.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
        
        this.socket.onclose = () => {
            this.updateStatus('Disconnected', 'red');
            setTimeout(() => this.connect(), 3000);
        };
        
        this.socket.onerror = () => {
            this.updateStatus('Connection Error', 'red');
        };
    }
    
    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'Enter') {
                if (this.chatInput) {
                    this.chatInput.focus();
                }
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Mouse input
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.handleClick(x, y);
            });
        }
        
        // Chat input
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                    this.chatInput.blur(); // Remove focus from chat input
                }
            });
        }
    }
    
    joinGame() {
        // Use the authenticated user's username automatically - NO PROMPT!
        this.sendMessage({
            type: 'join',
            name: this.currentUser.username,
            token: this.currentUser.token,
            x: Math.random() * 700 + 50,
            y: Math.random() * 500 + 50
        });
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'player_joined':
                this.addPlayer(data);
                break;
            case 'player_left':
                this.removePlayer(data.id);
                break;
            case 'player_moved':
                this.updatePlayerPosition(data);
                break;
            case 'world_state':
                this.updateWorldState(data);
                break;
            case 'chat_message':
                this.addChatMessage(data);
                break;
            case 'your_player':
                this.myPlayer = data;
                if (this.nameDisplay) {
                    this.nameDisplay.textContent = data.name;
                }
                break;
            case 'nearby_players':
                this.updateNearbyPlayers(data.nearby_players);
                break;
            case 'interaction_result':
                this.handleInteractionResult(data.result);
                break;
        }
    }
    
    addPlayer(playerData) {
        this.players.set(playerData.id, {
            id: playerData.id,
            name: playerData.name,
            x: playerData.x,
            y: playerData.y,
            targetX: playerData.x, // Target position for smooth movement
            targetY: playerData.y,
            color: this.getPlayerColor(playerData.id),
            moving: false,
            showInteractionHint: false
        });
    }
    
    removePlayer(playerId) {
        this.players.delete(playerId);
    }
    
    updatePlayerPosition(data) {
        const player = this.players.get(data.id);
        if (player) {
            // Set target position for smooth interpolation
            player.targetX = data.x;
            player.targetY = data.y;
            player.moving = true;
        }
        
        if (this.myPlayer && data.id === this.myPlayer.id) {
            this.myPlayer.x = data.x;
            this.myPlayer.y = data.y;
            if (this.posDisplay) {
                this.posDisplay.textContent = `${Math.round(data.x)}, ${Math.round(data.y)}`;
            }
        }
    }
    
    updateWorldState(data) {
        // Update all players
        if (data.players) {
            data.players.forEach(player => this.addPlayer(player));
        }
        
        // Clear NPCs and items for cleaner focus on players
        this.npcs.clear();
        this.items.clear();
        
        // Update online count
        if (this.onlineCountElement) {
            this.onlineCountElement.textContent = `Players: ${data.players ? data.players.length : 0}`;
        }
    }
    
    updateNearbyPlayers(nearbyPlayersData) {
        console.log('Updating nearby players:', nearbyPlayersData);
        
        // Check if the nearby players have actually changed
        const newPlayerIds = new Set(nearbyPlayersData.map(p => p.id));
        const oldPlayerIds = new Set(this.nearbyPlayers.keys());
        
        // If the sets are the same and interaction menu is visible, don't update
        if (this.interactionMenuVisible && 
            newPlayerIds.size === oldPlayerIds.size && 
            [...newPlayerIds].every(id => oldPlayerIds.has(id))) {
            console.log('Nearby players unchanged, skipping update to preserve menu');
            return;
        }
        
        this.nearbyPlayers.clear();
        
        nearbyPlayersData.forEach(playerData => {
            this.nearbyPlayers.set(playerData.id, playerData);
            console.log(`Nearby player: ${playerData.name} with ${playerData.interactions.length} interactions`);
        });
        
        // Only show/hide interaction options if there's a change
        if (this.nearbyPlayers.size > 0 && !this.interactionMenuVisible) {
            this.showInteractionOptions();
            this.addSystemMessage(`${this.nearbyPlayers.size} player(s) nearby - click on them to interact`);
        } else if (this.nearbyPlayers.size === 0 && this.interactionMenuVisible) {
            this.hideInteractionMenu();
        }
    }
    
    showInteractionOptions() {
        // Don't remove existing menu if it's already visible
        if (this.interactionMenuVisible) {
            return;
        }
        
        // Create interaction indicator for nearby players
        this.nearbyPlayers.forEach((playerData, playerId) => {
            const player = this.players.get(playerId);
            if (player) {
                player.showInteractionHint = true;
            }
        });
    }
    
    handleInput() {
        if (!this.myPlayer) return;
        
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveInterval) return;
        
        let newX = this.myPlayer.x;
        let newY = this.myPlayer.y;
        let moved = false;
        
        const speed = 8; // Increased speed for smoother movement
        
        if (this.keys['w'] || this.keys['arrowup']) {
            newY -= speed;
            moved = true;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            newY += speed;
            moved = true;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            newX -= speed;
            moved = true;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            newX += speed;
            moved = true;
        }
        
        // Boundary checking
        const canvas = this.canvas;
        if (canvas) {
            newX = Math.max(25, Math.min(canvas.width - 25, newX));
            newY = Math.max(25, Math.min(canvas.height - 25, newY));
        }
        
        if (moved && (newX !== this.myPlayer.x || newY !== this.myPlayer.y)) {
            this.sendMessage({
                type: 'move',
                x: newX,
                y: newY,
                token: this.currentUser.token
            });
            this.lastMoveTime = now;
        }
    }
    
    handleClick(x, y) {
        console.log(`Clicked at canvas position: ${x}, ${y}`);
        
        // Check if clicking on a nearby player
        let clickedPlayer = null;
        let minDistance = Infinity;
        
        this.nearbyPlayers.forEach((playerData, playerId) => {
            const player = this.players.get(playerId);
            if (player) {
                const distance = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
                console.log(`Distance to ${player.name}: ${distance}`);
                
                if (distance <= 30 && distance < minDistance) { // Keep click radius smaller
                    clickedPlayer = player;
                    minDistance = distance;
                }
            }
        });
        
        if (clickedPlayer) {
            console.log(`Clicked on player: ${clickedPlayer.name}`);
            this.showPlayerInteractionMenu(clickedPlayer, x, y);
        } else {
            console.log('No player clicked, hiding menu');
            this.hideInteractionMenu();
            // Send normal interaction message
            this.sendMessage({
                type: 'interact',
                x: x,
                y: y,
                token: this.currentUser.token
            });
        }
    }
    
    showPlayerInteractionMenu(player, canvasX, canvasY) {
        // Don't show menu if already visible for the same player
        if (this.interactionMenuVisible && this.selectedPlayer && this.selectedPlayer.id === player.id) {
            return;
        }
        
        // Clean up any existing menu and event listeners
        this.hideInteractionMenu();
        
        this.selectedPlayer = player;
        this.interactionMenuVisible = true;
        
        const playerData = this.nearbyPlayers.get(player.id);
        if (!playerData || !playerData.interactions) return;
        
        // Convert canvas coordinates to screen coordinates
        const rect = this.canvas.getBoundingClientRect();
        const screenX = rect.left + canvasX;
        const screenY = rect.top + canvasY;
        
        // Create medieval-style interaction menu
        const menu = document.createElement('div');
        menu.className = 'medieval-interaction-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${screenX}px`;
        menu.style.top = `${screenY}px`;
        menu.style.minWidth = '200px';
        menu.style.zIndex = '1500';
        menu.style.opacity = '0';
        menu.style.transform = 'scale(0.8) translateY(-10px)';
        menu.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Medieval frame styling
        menu.innerHTML = `
            <div class="medieval-interaction-frame">
                <!-- Corner decorations -->
                <div class="corner-decoration top-left">⚜️</div>
                <div class="corner-decoration top-right">⚜️</div>
                <div class="corner-decoration bottom-left">⚜️</div>
                <div class="corner-decoration bottom-right">⚜️</div>
                
                <!-- Header -->
                <div class="interaction-header">
                    <div class="player-mini-portrait" style="background-color: ${player.color}">
                        🛡️
                    </div>
                    <div class="interaction-title">
                        <h3>${player.name}</h3>
                        <p>Player Interactions</p>
                    </div>
                    <button class="close-btn medieval-btn-small">✕</button>
                </div>
                
                <!-- Interaction options -->
                <div class="interaction-options">
                    ${playerData.interactions.map((interaction, index) => `
                        <button class="medieval-interaction-btn ${interaction.enabled ? 'enabled' : 'disabled'}" 
                                data-type="${interaction.type}" 
                                ${!interaction.enabled ? 'disabled' : ''}
                                style="animation-delay: ${index * 0.1}s">
                            <span class="interaction-icon">${interaction.icon}</span>
                            <span class="interaction-label">${interaction.label}</span>
                            <span class="interaction-arrow">›</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        this.interactionMenu = menu;
        
        // Add event listeners
        const closeBtn = menu.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideInteractionMenu();
            });
        }
        
        // Add interaction button listeners
        menu.querySelectorAll('.medieval-interaction-btn.enabled').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const interactionType = btn.getAttribute('data-type');
                this.executePlayerInteraction(player.id, interactionType);
                this.hideInteractionMenu();
            });
        });
        
        // Prevent menu clicks from bubbling
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Animate in
        setTimeout(() => {
            menu.style.opacity = '1';
            menu.style.transform = 'scale(1) translateY(0)';
        }, 10);
        
        // Set up click-outside handler with proper cleanup
        this.closeHandler = (event) => {
            // Check if the menu still exists and the click is outside
            if (this.interactionMenu && !this.interactionMenu.contains(event.target)) {
                this.hideInteractionMenu();
            }
        };
        
        // Add the click-outside listener after a delay to prevent immediate closing
        setTimeout(() => {
            if (this.interactionMenuVisible && this.closeHandler) {
                document.addEventListener('click', this.closeHandler, { once: true });
            }
        }, 200); // Increased delay to ensure menu is fully rendered
    }

    hideInteractionMenu() {
        // Clean up the close handler first
        if (this.closeHandler) {
            document.removeEventListener('click', this.closeHandler);
            this.closeHandler = null;
        }
        
        if (this.interactionMenu) {
            // Animate out
            this.interactionMenu.style.opacity = '0';
            this.interactionMenu.style.transform = 'scale(0.8) translateY(-10px)';
            
            setTimeout(() => {
                if (this.interactionMenu && this.interactionMenu.parentNode) {
                    this.interactionMenu.remove();
                    this.interactionMenu = null;
                }
            }, 300);
        }
        this.selectedPlayer = null;
        this.interactionMenuVisible = false;
        
        // Remove interaction hints
        this.players.forEach(player => {
            player.showInteractionHint = false;
        });
    }

    startFloatingAnimation(element) {
        let start = Date.now();
        const animate = () => {
            if (!element || !element.parentNode) return;
            
            const elapsed = Date.now() - start;
            const y = Math.sin(elapsed * 0.001) * 3;
            const currentTransform = element.style.transform;
            
            // Preserve existing transform and add floating effect
            if (currentTransform.includes('translate(-50%, -50%)')) {
                element.style.transform = `translate(-50%, calc(-50% + ${y}px)) scale(1)`;
            }
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    render() {
        if (!this.canvas || !this.ctx) return;
        
        // Clear canvas with a clean background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw subtle grid for reference
        this.drawGrid();
        
        // Smooth interpolation for all players
        this.interpolatePlayers();
        
        // Draw only players - clean focus
        this.players.forEach(player => this.drawPlayer(player));
    }
    
    interpolatePlayers() {
        this.players.forEach(player => {
            if (player.moving) {
                // Smooth interpolation towards target position
                const deltaX = player.targetX - player.x;
                const deltaY = player.targetY - player.y;
                
                if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
                    // Close enough to target, snap to position
                    player.x = player.targetX;
                    player.y = player.targetY;
                    player.moving = false;
                } else {
                    // Interpolate towards target
                    player.x += deltaX * this.interpolationFactor;
                    player.y += deltaY * this.interpolationFactor;
                }
            }
        });
    }
    
    drawGrid() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.1)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 100; // Larger grid for cleaner look
        
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
        
        // Enhanced player drawing with smooth effects
        const radius = 20;
        
        // Draw player shadow/glow
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x + 2, player.y + 2, radius + 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Draw main player circle
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Highlight own player
        if (this.myPlayer && player.id === this.myPlayer.id) {
            this.ctx.strokeStyle = '#4a90e2';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            
            // Add pulsing effect for own player
            this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.5)';
            this.ctx.lineWidth = 8;
            this.ctx.stroke();
        }
        
        // Draw interaction hint if nearby
        if (player.showInteractionHint) {
            this.ctx.save();
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([8, 8]);
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, radius + 15, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Draw interaction icon
            this.ctx.fillStyle = '#f1c40f';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💬', player.x, player.y - radius - 35);
            this.ctx.restore();
        }
        
        // Draw player name with background
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
            this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, radius + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    getPlayerColor(playerId) {
        const colors = [
            '#3498db', // Blue
            '#e67e22', // Orange  
            '#2ecc71', // Green
            '#9b59b6', // Purple
            '#f1c40f', // Yellow
            '#e74c3c', // Red
            '#1abc9c', // Turquoise
            '#34495e'  // Dark Gray
        ];
        return colors[playerId.charCodeAt(0) % colors.length];
    }

    checkNearbyPlayers() {
        // Only check if we don't have an active interaction menu
        if (this.interactionMenuVisible) {
            return;
        }
        
        const now = Date.now();
        if (now - this.lastNearbyCheck > this.nearbyCheckInterval) {
            this.sendMessage({
                type: 'get_nearby_players',
                token: this.currentUser.token
            });
            this.lastNearbyCheck = now;
        }
    }
    
    sendChatMessage() {
        if (!this.chatInput) return;
        
        const message = this.chatInput.value.trim();
        if (message) {
            this.sendMessage({
                type: 'chat',
                message: message,
                token: this.currentUser.token
            });
            this.chatInput.value = '';
        }
    }
    
    addChatMessage(data) {
        if (!this.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message player';
        
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageDiv.innerHTML = `<span style="color: #888;">[${timestamp}]</span> <strong>${data.name}:</strong> ${data.message}`;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Limit message history
        while (this.chatMessages.children.length > 100) {
            this.chatMessages.removeChild(this.chatMessages.firstChild);
        }
    }
    
    addSystemMessage(message) {
        if (!this.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system';
        
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        messageDiv.innerHTML = `<span style="color: #888;">[${timestamp}]</span> <strong>System:</strong> ${message}`;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    updateOnlineCount(count) {
        if (this.onlineCountElement) {
            this.onlineCountElement.textContent = `Players: ${count}`;
        }
    }
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = '/auth';
    }
    
    sendMessage(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }
    
    updateStatus(text, status) {
        if (!this.statusElement) return;
        
        this.statusElement.textContent = text;
        this.statusElement.className = status === 'green' ? 'connected' : 
                                       status === 'red' ? 'disconnected' : 'connecting';
    }
    
    gameLoop() {
        this.handleInput();
        this.checkNearbyPlayers();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    executePlayerInteraction(toPlayerId, interactionType) {
        this.sendMessage({
            type: 'player_interact',
            to_player_id: toPlayerId,
            interaction_type: interactionType,
            token: this.currentUser.token
        });
    }
    
    handleInteractionResult(result) {
        if (result.success) {
            this.addSystemMessage(result.message || 'Interaction completed');
            
            // Handle specific actions
            switch (result.action) {
                case 'show_player_stats':
                    this.showPlayerStats(result.stats);
                    break;
                case 'show_trade_window':
                    this.showTradeWindow();
                    break;
            }
        } else {
            this.addSystemMessage(`Error: ${result.error}`);
        }
    }
    
    showPlayerStats(stats) {
        // Remove any existing stats popup
        const existingPopup = document.querySelector('.medieval-stats-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create medieval-style stats popup
        const popup = document.createElement('div');
        popup.className = 'medieval-stats-popup';
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%) scale(0.8)';
        popup.style.opacity = '0';
        popup.style.zIndex = '2000';
        popup.style.width = '420px';
        popup.style.maxHeight = '600px';
        popup.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // Create the ornate frame
        popup.innerHTML = `
            <div class="medieval-frame">
                <!-- Ornate Corner Decorations -->
                <div class="corner-decoration top-left">⚜️</div>
                <div class="corner-decoration top-right">⚜️</div>
                <div class="corner-decoration bottom-left">⚜️</div>
                <div class="corner-decoration bottom-right">⚜️</div>
                
                <!-- Header with player portrait -->
                <div class="stats-header">
                    <div class="player-portrait">
                        <div class="portrait-frame">
                            <div class="portrait-image" style="background-color: ${this.getPlayerColor(stats.name)}">
                                <span class="portrait-icon">🛡️</span>
                            </div>
                        </div>
                    </div>
                    <div class="player-title">
                        <h2 class="player-name">${stats.name}</h2>
                        <p class="player-class">Adventurer • Level ${stats.level || 1}</p>
                    </div>
                    <button class="close-btn medieval-btn">✕</button>
                </div>
                
                <!-- Main Stats Panel -->
                <div class="stats-content">
                    <!-- Vital Stats -->
                    <div class="stats-section">
                        <h3 class="section-title">
                            <span class="title-icon">❤️</span>
                            Vital Statistics
                        </h3>
                        <div class="vital-stats">
                            <div class="stat-bar-container">
                                <div class="stat-label">
                                    <span class="stat-icon">❤️</span>
                                    <span>Health</span>
                                    <span class="stat-value">${stats.health}/100</span>
                                </div>
                                <div class="stat-bar health-bar">
                                    <div class="stat-bar-fill" style="width: ${stats.health}%">
                                        <div class="stat-bar-shine"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-bar-container">
                                <div class="stat-label">
                                    <span class="stat-icon">⚡</span>
                                    <span>Mana</span>
                                    <span class="stat-value">${stats.mana}/50</span>
                                </div>
                                <div class="stat-bar mana-bar">
                                    <div class="stat-bar-fill" style="width: ${(stats.mana/50)*100}%">
                                        <div class="stat-bar-shine"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-bar-container">
                                <div class="stat-label">
                                    <span class="stat-icon">🛡️</span>
                                    <span>Stamina</span>
                                    <span class="stat-value">100/100</span>
                                </div>
                                <div class="stat-bar stamina-bar">
                                    <div class="stat-bar-fill" style="width: 100%">
                                        <div class="stat-bar-shine"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Attributes -->
                    <div class="stats-section">
                        <h3 class="section-title">
                            <span class="title-icon">⚔️</span>
                            Core Attributes
                        </h3>
                        <div class="attribute-grid">
                            <div class="attribute-item">
                                <div class="attr-icon">💪</div>
                                <div class="attr-info">
                                    <span class="attr-name">Strength</span>
                                    <span class="attr-value">15</span>
                                </div>
                            </div>
                            <div class="attribute-item">
                                <div class="attr-icon">🏃</div>
                                <div class="attr-info">
                                    <span class="attr-name">Agility</span>
                                    <span class="attr-value">12</span>
                                </div>
                            </div>
                            <div class="attribute-item">
                                <div class="attr-icon">🧠</div>
                                <div class="attr-info">
                                    <span class="attr-name">Intelligence</span>
                                    <span class="attr-value">18</span>
                                </div>
                            </div>
                            <div class="attribute-item">
                                <div class="attr-icon">💎</div>
                                <div class="attr-info">
                                    <span class="attr-name">Wisdom</span>
                                    <span class="attr-value">14</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Combat Stats -->
                    <div class="stats-section">
                        <h3 class="section-title">
                            <span class="title-icon">⚔️</span>
                            Combat Statistics
                        </h3>
                        <div class="combat-stats">
                            <div class="combat-row">
                                <span class="combat-label">🗡️ Attack Power</span>
                                <span class="combat-value">25-32</span>
                            </div>
                            <div class="combat-row">
                                <span class="combat-label">🛡️ Defense</span>
                                <span class="combat-value">18</span>
                            </div>
                            <div class="combat-row">
                                <span class="combat-label">🎯 Critical Hit</span>
                                <span class="combat-value">5%</span>
                            </div>
                            <div class="combat-row">
                                <span class="combat-label">💨 Speed</span>
                                <span class="combat-value">12</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location Info -->
                    <div class="stats-section">
                        <h3 class="section-title">
                            <span class="title-icon">🗺️</span>
                            Current Location
                        </h3>
                        <div class="location-info">
                            <div class="location-row">
                                <span class="location-label">📍 Position</span>
                                <span class="location-value">${Math.round(stats.position.X)}, ${Math.round(stats.position.Y)}</span>
                            </div>
                            <div class="location-row">
                                <span class="location-label">🏰 Region</span>
                                <span class="location-value">Central Plains</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer with action buttons -->
                <div class="stats-footer">
                    <button class="medieval-btn primary-btn">
                        <span class="btn-icon">📋</span>
                        View Details
                    </button>
                    <button class="medieval-btn secondary-btn close-stats">
                        <span class="btn-icon">✅</span>
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Add event listeners
        popup.querySelector('.close-btn').addEventListener('click', () => {
            this.hideStatsPopup(popup);
        });
        
        popup.querySelector('.close-stats').addEventListener('click', () => {
            this.hideStatsPopup(popup);
        });
        
        // Click outside to close
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!popup.contains(e.target)) {
                    this.hideStatsPopup(popup);
                }
            }, { once: true });
        }, 100);
        
        // Animate in
        setTimeout(() => {
            popup.style.opacity = '1';
            popup.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
        
        // Add floating animation
        this.startFloatingAnimation(popup);
    }
    
    hideStatsPopup(popup) {
        popup.style.opacity = '0';
        popup.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
            }
        }, 400);
    }
    
    showTradeWindow() {
        this.addSystemMessage('Trade system coming soon!');
    }
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new MMORPGClient();
});
