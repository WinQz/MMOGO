export class InteractionManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.nearbyPlayers = new Map();
        this.interactionMenu = null;
        this.selectedPlayer = null;
        this.interactionMenuVisible = false;
        this.closeHandler = null;
        this.lastNearbyCheck = 0;
        this.nearbyCheckInterval = 1000;
    }
    
    update() {
        this.checkNearbyPlayers();
    }
    
    handleClick(x, y) {
        let clickedPlayer = null;
        let minDistance = Infinity;
        
        this.nearbyPlayers.forEach((playerData, playerId) => {
            const playerManager = this.gameClient.getPlayerManager();
            const player = playerManager.getPlayer(playerId);
            if (player) {
                const dx = x - player.x;
                const dy = y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 30 && distance < minDistance) {
                    clickedPlayer = player;
                    minDistance = distance;
                }
            }
        });
        
        if (clickedPlayer) {
            this.showPlayerInteractionMenu(clickedPlayer, x, y);
        } else {
            this.hideInteractionMenu();
        }
    }
    
    checkNearbyPlayers() {
        const now = Date.now();
        if (now - this.lastNearbyCheck > this.nearbyCheckInterval) {
            const myPlayer = this.gameClient.getMyPlayer();
            if (myPlayer) {
                this.gameClient.getNetworkManager().sendMessage({
                    type: 'get_nearby_players',
                    player_id: myPlayer.id
                });
            }
            this.lastNearbyCheck = now;
        }
    }
    
    updateNearbyPlayers(nearbyPlayersData) {
        this.nearbyPlayers.clear();
        
        nearbyPlayersData.forEach(playerData => {
            this.nearbyPlayers.set(playerData.id, playerData);
        });
        
        // Update interaction hints for nearby players
        this.updateInteractionHints();
    }
    
    updateInteractionHints() {
        const playerManager = this.gameClient.getPlayerManager();
        const allPlayers = playerManager.getAllPlayers();
        
        // Remove hints from all players first
        allPlayers.forEach(player => {
            player.showInteractionHint = false;
        });
        
        // Add hints to nearby players
        this.nearbyPlayers.forEach((playerData, playerId) => {
            const player = playerManager.getPlayer(playerId);
            if (player) {
                player.showInteractionHint = true;
            }
        });
    }

    showPlayerInteractionMenu(player, canvasX, canvasY) {
        if (this.interactionMenuVisible && this.selectedPlayer && this.selectedPlayer.id === player.id) {
            return;
        }
        
        this.hideInteractionMenu();
        
        this.selectedPlayer = player;
        this.interactionMenuVisible = true;
        
        const playerData = this.nearbyPlayers.get(player.id);
        if (!playerData || !playerData.interactions) return;
        
        // Convert canvas coordinates to screen coordinates
        const canvas = this.gameClient.getCanvas();
        const rect = canvas.getBoundingClientRect();
        const screenX = rect.left + canvasX;
        const screenY = rect.top + canvasY;
        
        // Create menu
        const menu = document.createElement('div');
        menu.className = 'medieval-interaction-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${screenX}px`;
        menu.style.top = `${screenY}px`;
        menu.style.zIndex = '1500';
        
        menu.innerHTML = `
            <div class="medieval-interaction-frame">
                <div class="corner-decoration top-left">⚜️</div>
                <div class="corner-decoration top-right">⚜️</div>
                <div class="corner-decoration bottom-left">⚜️</div>
                <div class="corner-decoration bottom-right">⚜️</div>
                
                <div class="interaction-header">
                    <div class="player-mini-portrait" style="background-color: ${player.color}">🛡️</div>
                    <div class="interaction-title">
                        <h3>${player.name}</h3>
                        <p>Player Interactions</p>
                    </div>
                    <button class="close-btn medieval-btn-small">✕</button>
                </div>
                
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
            closeBtn.addEventListener('click', () => this.hideInteractionMenu());
        }
        
        menu.querySelectorAll('.medieval-interaction-btn.enabled').forEach(btn => {
            btn.addEventListener('click', () => {
                const interactionType = btn.getAttribute('data-type');
                
                // Handle "view_stats" interaction type
                if (interactionType === 'view_stats') {
                    this.showPlayerStats(player);
                    this.hideInteractionMenu();
                } else {
                    this.executePlayerInteraction(player.id, interactionType);
                    this.hideInteractionMenu();
                }
            });
        });
        
        // Click outside handler
        setTimeout(() => {
            this.closeHandler = (event) => {
                if (!menu.contains(event.target)) {
                    this.hideInteractionMenu();
                }
            };
            document.addEventListener('click', this.closeHandler);
        }, 200);
    }
    
    hideInteractionMenu() {
        if (this.closeHandler) {
            document.removeEventListener('click', this.closeHandler);
            this.closeHandler = null;
        }
        
        if (this.interactionMenu) {
            this.interactionMenu.remove();
            this.interactionMenu = null;
        }
        
        this.selectedPlayer = null;
        this.interactionMenuVisible = false;
    }
    
    executePlayerInteraction(toPlayerId, interactionType) {
        const currentUser = this.gameClient.getCurrentUser();
        this.gameClient.getNetworkManager().sendMessage({
            type: 'player_interact',
            to_player_id: toPlayerId,
            interaction_type: interactionType,
            token: currentUser.token
        });
    }
    
    handleInteractionResult(result) {
        if (result.success) {
            console.log('Interaction successful:', result);
        } else {
            console.log('Interaction failed:', result.message);
        }
    }
    
    showPlayerStats(player) {
        // Remove any existing stats popup
        const existingPopup = document.getElementById('player-stats-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create stats popup
        const statsPopup = document.createElement('div');
        statsPopup.id = 'player-stats-popup';
        statsPopup.className = 'medieval-stats-popup';
        statsPopup.style.position = 'fixed';
        statsPopup.style.top = '50%';
        statsPopup.style.left = '50%';
        statsPopup.style.transform = 'translate(-50%, -50%)';
        statsPopup.style.zIndex = '2000';
        
        statsPopup.innerHTML = `
            <div class="medieval-frame">
                <!-- Corner Decorations -->
                <div class="corner-decoration top-left">⚜️</div>
                <div class="corner-decoration top-right">⚜️</div>
                <div class="corner-decoration bottom-left">⚜️</div>
                <div class="corner-decoration bottom-right">⚜️</div>
                
                <!-- Header -->
                <div class="stats-header">
                    <div class="player-portrait">
                        <div class="portrait-frame">
                            <div class="portrait-image" style="background-color: ${player.color}">
                                <div class="portrait-icon">🛡️</div>
                            </div>
                        </div>
                    </div>
                    <div class="player-title">
                        <h2 class="player-name">${player.name}</h2>
                        <p class="player-class">Adventurer • Level 1</p>
                    </div>
                    <button class="close-btn medieval-btn">✕</button>
                </div>
                
                <!-- Stats Content -->
                <div class="stats-content">
                    <!-- Vital Stats -->
                    <div class="stats-section">
                        <h3 class="section-title">
                            <span class="title-icon">❤️</span>
                            Vital Statistics
                        </h3>
                        <div class="vital-stats">
                            <div class="stat-bar-container health-bar">
                                <div class="stat-label">
                                    <span><span class="stat-icon">❤️</span>Health</span>
                                    <span class="stat-value">100/100</span>
                                </div>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" style="width: 100%">
                                        <div class="stat-bar-shine"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-bar-container mana-bar">
                                <div class="stat-label">
                                    <span><span class="stat-icon">⚡</span>Mana</span>
                                    <span class="stat-value">50/50</span>
                                </div>
                                <div class="stat-bar">
                                    <div class="stat-bar-fill" style="width: 100%">
                                        <div class="stat-bar-shine"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="stat-bar-container stamina-bar">
                                <div class="stat-label">
                                    <span><span class="stat-icon">🏃</span>Stamina</span>
                                    <span class="stat-value">100/100</span>
                                </div>
                                <div class="stat-bar">
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
                            <span class="title-icon">💪</span>
                            Attributes
                        </h3>
                        <div class="attribute-grid">
                            <div class="attribute-item">
                                <div class="attr-icon">💪</div>
                                <div class="attr-info">
                                    <div class="attr-name">Strength</div>
                                    <div class="attr-value">10</div>
                                </div>
                            </div>
                            <div class="attribute-item">
                                <div class="attr-icon">🏃</div>
                                <div class="attr-info">
                                    <div class="attr-name">Agility</div>
                                    <div class="attr-value">8</div>
                                </div>
                            </div>
                            <div class="attribute-item">
                                <div class="attr-icon">🧠</div>
                                <div class="attr-info">
                                    <div class="attr-name">Intelligence</div>
                                    <div class="attr-value">12</div>
                                </div>
                            </div>
                            <div class="attribute-item">
                                <div class="attr-icon">🛡️</div>
                                <div class="attr-info">
                                    <div class="attr-name">Defense</div>
                                    <div class="attr-value">6</div>
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
                                <span class="combat-value">15-20</span>
                            </div>
                            <div class="combat-row">
                                <span class="combat-label">🛡️ Defense Rating</span>
                                <span class="combat-value">12</span>
                            </div>
                            <div class="combat-row">
                                <span class="combat-label">🎯 Critical Chance</span>
                                <span class="combat-value">5%</span>
                            </div>
                            <div class="combat-row">
                                <span class="combat-label">💨 Attack Speed</span>
                                <span class="combat-value">1.2s</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location Info -->
                    <div class="stats-section">
                        <h3 class="section-title">
                            <span class="title-icon">📍</span>
                            Location & Status
                        </h3>
                        <div class="location-info">
                            <div class="location-row">
                                <span class="location-label">🌍 Current Area</span>
                                <span class="location-value">Medieval Realm</span>
                            </div>
                            <div class="location-row">
                                <span class="location-label">📍 Position</span>
                                <span class="location-value">(${Math.round(player.x)}, ${Math.round(player.y)})</span>
                            </div>
                            <div class="location-row">
                                <span class="location-label">⏱️ Online Time</span>
                                <span class="location-value">Session Active</span>
                            </div>
                            <div class="location-row">
                                <span class="location-label">🏆 Player Level</span>
                                <span class="location-value">1</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="stats-footer">
                    <button class="medieval-btn">
                        <span class="btn-icon">👥</span>
                        Add Friend
                    </button>
                    <button class="medieval-btn secondary-btn">
                        <span class="btn-icon">💬</span>
                        Send Message
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(statsPopup);
        
        // Add close button functionality
        const closeBtn = statsPopup.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                statsPopup.remove();
            });
        }
        
        // Click outside to close
        setTimeout(() => {
            const outsideClickHandler = (event) => {
                if (!statsPopup.contains(event.target)) {
                    statsPopup.remove();
                    document.removeEventListener('click', outsideClickHandler);
                }
            };
            document.addEventListener('click', outsideClickHandler);
        }, 200);
        
        // Escape key to close
        const escapeHandler = (event) => {
            if (event.key === 'Escape') {
                statsPopup.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
}
