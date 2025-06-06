const serverUrl = "ws://localhost:8080/ws"; // Update with your server URL

let socket;

function connect() {
    socket = new WebSocket(serverUrl);

    socket.onopen = function() {
        console.log("Connected to the server");
    };

    socket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };

    socket.onclose = function(event) {
        console.log("Disconnected from the server");
        setTimeout(connect, 1000); // Reconnect after 1 second
    };

    socket.onerror = function(error) {
        console.error("WebSocket error:", error);
    };
}

function handleMessage(message) {
    switch (message.type) {
        case "playerUpdate":
            updatePlayer(message.data);
            break;
        case "gameEvent":
            handleGameEvent(message.data);
            break;
        default:
            console.warn("Unknown message type:", message.type);
    }
}

function updatePlayer(data) {
    // Update player state based on data received
    console.log("Player updated:", data);
}

function handleGameEvent(data) {
    // Handle game events such as item pickups, NPC interactions, etc.
    console.log("Game event received:", data);
}

// Call connect to initiate WebSocket connection
connect();

class GameClient {
    constructor() {
        this.socket = null;
        this.statusElement = document.getElementById('status');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendMessage');
        
        this.connect();
        this.setupEventListeners();
    }
    
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
            this.statusElement.textContent = 'Connected';
            this.statusElement.style.color = 'green';
        };
        
        this.socket.onmessage = (event) => {
            console.log('Received message:', event.data);
            this.handleMessage(event.data);
        };
        
        this.socket.onclose = () => {
            this.statusElement.textContent = 'Disconnected';
            this.statusElement.style.color = 'red';
            setTimeout(() => this.connect(), 3000);
        };
        
        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.statusElement.textContent = 'Connection Error';
            this.statusElement.style.color = 'red';
        };
    }
    
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
            this.messageInput.value = '';
        }
    }
    
    handleMessage(data) {
        const gameArea = document.getElementById('gameArea');
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `Message: ${data}`;
        gameArea.appendChild(messageDiv);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameClient();
});