import { MessageHandler } from './MessageHandler.js';

export class NetworkManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.socket = null;
        this.messageHandler = new MessageHandler(gameClient);
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    async connect() {
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('Connected to server');
                this.updateStatus('Connected', 'green');
                this.reconnectAttempts = 0;
                this.joinGame();
                resolve();
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.messageHandler.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };
            
            this.socket.onclose = () => {
                console.log('Disconnected from server');
                this.updateStatus('Disconnected', 'red');
                this.attemptReconnect();
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateStatus('Connection Error', 'red');
                reject(error);
            };
        });
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateStatus(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'yellow');
            
            setTimeout(() => {
                this.connect().catch(() => {
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        this.updateStatus('Connection Failed', 'red');
                    }
                });
            }, 3000);
        }
    }
    
    joinGame() {
        const canvas = this.gameClient.getCanvas();
        const currentUser = this.gameClient.getCurrentUser();
        
        const spawnX = canvas ? canvas.width / 2 : 600;
        const spawnY = canvas ? canvas.height / 2 : 400;
        
        this.sendMessage({
            type: 'join',
            name: currentUser.username,
            token: currentUser.token,
            x: spawnX + (Math.random() - 0.5) * 200,
            y: spawnY + (Math.random() - 0.5) * 200
        });
    }
    
    sendMessage(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }
    
    updateStatus(text, status) {
        const statusElement = document.getElementById('status');
        if (!statusElement) return;
        
        statusElement.textContent = text;
        statusElement.className = status === 'green' ? 'connected' : 
                                  status === 'red' ? 'disconnected' : 'connecting';
    }
}
