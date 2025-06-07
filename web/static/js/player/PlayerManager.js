export class PlayerManager {
    constructor() {
        this.players = new Map();
        this.interpolationFactor = 0.15;
    }
    
    addPlayer(playerData) {
        const player = {
            id: playerData.id,
            name: playerData.name,
            x: playerData.x,
            y: playerData.y,
            targetX: playerData.x,
            targetY: playerData.y,
            color: this.getPlayerColor(playerData.id),
            moving: false,
            showInteractionHint: false
        };
        
        this.players.set(playerData.id, player);
        return player;
    }
    
    removePlayer(playerId) {
        this.players.delete(playerId);
    }
    
    updatePlayerPosition(data) {
        const player = this.players.get(data.id);
        if (player) {
            player.targetX = data.x;
            player.targetY = data.y;
            player.moving = true;
        }
    }
    
    updateWorldState(data) {
        if (data.players) {
            data.players.forEach(playerData => {
                if (!this.players.has(playerData.id)) {
                    this.addPlayer(playerData);
                } else {
                    const player = this.players.get(playerData.id);
                    player.targetX = playerData.x;
                    player.targetY = playerData.y;
                }
            });
        }
        
        // Update online count
        const onlineCountElement = document.getElementById('onlineCount');
        if (onlineCountElement) {
            onlineCountElement.textContent = `Players: ${data.players ? data.players.length : 0}`;
        }
    }
    
    movePlayer(newX, newY, sprinting, gameClient) {
        const myPlayer = gameClient.getMyPlayer();
        if (!myPlayer) return;
        
        // Boundary checking
        const canvas = gameClient.getCanvas();
        if (canvas) {
            const margin = 25;
            newX = Math.max(margin, Math.min(canvas.width - margin, newX));
            newY = Math.max(margin, Math.min(canvas.height - margin, newY));
        }
        
        if (newX !== myPlayer.x || newY !== myPlayer.y) {
            myPlayer.x = newX;
            myPlayer.y = newY;
            myPlayer.moving = true;
            
            // Send movement to server
            gameClient.getNetworkManager().sendMessage({
                type: 'move',
                x: newX,
                y: newY,
                sprinting: sprinting
            });
            
            // Stop moving animation after delay
            setTimeout(() => {
                if (myPlayer) {
                    myPlayer.moving = false;
                }
            }, 200);
        }
    }
    
    update() {
        // Interpolate player positions
        this.players.forEach(player => {
            if (player.targetX !== undefined && player.targetY !== undefined) {
                player.x += (player.targetX - player.x) * this.interpolationFactor;
                player.y += (player.targetY - player.y) * this.interpolationFactor;
            }
        });
    }
    
    getAllPlayers() {
        return this.players;
    }
    
    getPlayer(id) {
        return this.players.get(id);
    }
    
    getPlayerColor(playerId) {
        const colors = [
            '#3498db', '#e67e22', '#2ecc71', '#9b59b6',
            '#f1c40f', '#e74c3c', '#1abc9c', '#34495e'
        ];
        return colors[playerId.charCodeAt(0) % colors.length];
    }
}
