export class UIManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.chatInput = document.getElementById('chatInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.sendButton = document.getElementById('sendButton');
    }
    
    setupUI() {
        this.setupUIHandlers();
        this.populateUI();
    }
    
    populateUI() {
        // Add missing UI elements
        const playerInfo = document.getElementById('playerInfo');
        if (playerInfo && playerInfo.innerHTML.trim() === '') {
            playerInfo.innerHTML = `
                <div id="avatar">
                    <img src="/static/avatar.png" alt="Avatar" onerror="this.style.display='none'">
                    <div id="avatarFallback">👤</div>
                </div>
                <div id="playerDetails">
                    <div id="playerName">Player: <span id="nameDisplay">Guest</span></div>
                    <div id="playerStats">
                        <div class="stat">❤️ <span id="health">100/100</span></div>
                        <div class="stat">⚡ <span id="mana">50/50</span></div>
                        <div class="stat">🏃 <span id="stamina">100/100</span></div>
                    </div>
                    <div id="staminaBarContainer" class="stat-bar-container">
                        <div class="stat-bar-background">
                            <div id="staminaBar" class="stat-bar-fill stamina-bar"></div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const serverInfo = document.getElementById('serverInfo');
        if (serverInfo && serverInfo.innerHTML.trim() === '') {
            serverInfo.innerHTML = `
                <span id="status">Connecting...</span>
                <span id="onlineCount">Players: 0</span>
            `;
        }
        
        const chatControls = document.getElementById('chatControls');
        if (chatControls && chatControls.innerHTML.trim() === '') {
            chatControls.innerHTML = `
                <button id="chatMinimize">−</button>
                <button id="chatClose">×</button>
            `;
        }
        
        const instructionsContent = document.getElementById('instructionsContent');
        if (instructionsContent && instructionsContent.innerHTML.trim() === '') {
            instructionsContent.innerHTML = `
                <h3>🎮 Controls</h3>
                <div class="control-group">
                    <div class="control-item">
                        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move
                    </div>
                    <div class="control-item">
                        <kbd>Shift</kbd> Sprint
                    </div>
                    <div class="control-item">
                        <kbd>Enter</kbd> Chat
                    </div>
                    <div class="control-item">
                        <kbd>Click</kbd> Interact
                    </div>
                </div>
            `;
        }
    }
    
    setupUIHandlers() {
        // Chat minimize/close handlers
        const chatMinimize = document.getElementById('chatMinimize');
        if (chatMinimize) {
            chatMinimize.addEventListener('click', () => {
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) {
                    chatPanel.style.height = chatPanel.style.height === '50px' ? '350px' : '50px';
                }
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
                this.gameClient.authManager.logout();
            });
        }
        
        // Chat tab handlers
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }
    
    sendChatMessage() {
        if (!this.chatInput) return;
        
        const message = this.chatInput.value.trim();
        if (message) {
            this.gameClient.getNetworkManager().sendMessage({
                type: 'chat',
                message: message
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
}
