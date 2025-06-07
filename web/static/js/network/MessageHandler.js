export class MessageHandler {
    constructor(gameClient) {
        this.gameClient = gameClient;
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'your_player':
                this.handleYourPlayer(data);
                break;
                
            case 'world_state':
                this.handleWorldState(data);
                break;
                
            case 'player_joined':
                this.handlePlayerJoined(data);
                break;
                
            case 'player_left':
                this.handlePlayerLeft(data);
                break;
                
            case 'player_moved':
                this.handlePlayerMoved(data);
                break;
                
            case 'chat_message':
                this.handleChatMessage(data);
                break;
                
            case 'nearby_players':
                this.handleNearbyPlayers(data);
                break;
                
            case 'interaction_result':
                this.handleInteractionResult(data);
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    handleYourPlayer(data) {
        const player = {
            id: data.id,
            name: data.name,
            x: data.x,
            y: data.y,
            targetX: data.x,
            targetY: data.y,
            color: this.getPlayerColor(data.id),
            moving: false,
            showInteractionHint: false
        };
        
        this.gameClient.setMyPlayer(player);
        this.gameClient.playerManager.addPlayer(player);
    }
    
    handleWorldState(data) {
        this.gameClient.playerManager.updateWorldState(data);
    }
    
    handlePlayerJoined(data) {
        this.gameClient.playerManager.addPlayer(data);
        this.gameClient.uiManager.addSystemMessage(`${data.name} joined the game`);
    }
    
    handlePlayerLeft(data) {
        this.gameClient.playerManager.removePlayer(data.id);
    }
    
    handlePlayerMoved(data) {
        this.gameClient.playerManager.updatePlayerPosition(data);
    }
    
    handleChatMessage(data) {
        this.gameClient.uiManager.addChatMessage(data);
    }
    
    handleNearbyPlayers(data) {
        this.gameClient.interactionManager.updateNearbyPlayers(data.nearby_players);
    }
    
    handleInteractionResult(data) {
        this.gameClient.interactionManager.handleInteractionResult(data.result);
    }
    
    getPlayerColor(playerId) {
        const colors = [
            '#3498db', '#e67e22', '#2ecc71', '#9b59b6',
            '#f1c40f', '#e74c3c', '#1abc9c', '#34495e'
        ];
        return colors[playerId.charCodeAt(0) % colors.length];
    }
}
