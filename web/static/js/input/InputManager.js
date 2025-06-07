export class InputManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.keys = {};
        this.lastMoveTime = 0;
        this.moveInterval = 50;
    }
    
    setupInputHandlers() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse input
        const canvas = this.gameClient.getCanvas();
        if (canvas) {
            canvas.addEventListener('click', (e) => this.handleClick(e));
        }
        
        // Chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.gameClient.uiManager.sendChatMessage();
                    chatInput.blur();
                }
            });
        }
    }
    
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = true;
        
        // Handle sprint key
        if (key === 'shift') {
            this.gameClient.staminaSystem.startSprint();
            e.preventDefault();
        }
        
        if (key === 'enter') {
            e.preventDefault();
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.focus();
            }
        }
    }
    
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
        
        // Handle sprint key release
        if (key === 'shift') {
            this.gameClient.staminaSystem.stopSprint();
            e.preventDefault();
        }
    }
    
    handleClick(e) {
        const canvas = this.gameClient.getCanvas();
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.gameClient.interactionManager.handleClick(x, y);
    }
    
    handleInput() {
        const myPlayer = this.gameClient.getMyPlayer();
        if (!myPlayer) return;
        
        const now = Date.now();
        if (now - this.lastMoveTime < this.moveInterval) return;
        
        let newX = myPlayer.x;
        let newY = myPlayer.y;
        let moved = false;
        
        const baseSpeed = 8;
        const sprintMultiplier = 1.5;
        const isSprintActive = this.gameClient.staminaSystem.isSprintActive();
        const speed = isSprintActive ? baseSpeed * sprintMultiplier : baseSpeed;
        
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
        
        if (moved) {
            this.gameClient.playerManager.movePlayer(newX, newY, isSprintActive, this.gameClient);
            this.lastMoveTime = now;
        }
    }
}
