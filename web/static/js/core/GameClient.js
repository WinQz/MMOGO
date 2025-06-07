import { LoadingScreen } from '../ui/LoadingScreen.js';
import { AuthManager } from '../auth/AuthManager.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { InputManager } from '../input/InputManager.js';
import { RenderManager } from '../rendering/RenderManager.js';
import { UIManager } from '../ui/UIManager.js';
import { PlayerManager } from '../player/PlayerManager.js';
import { StaminaSystem } from '../player/StaminaSystem.js';
import { InteractionManager } from '../interaction/InteractionManager.js';

export class GameClient {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize all managers
        this.loadingScreen = new LoadingScreen();
        this.authManager = new AuthManager();
        this.networkManager = new NetworkManager(this);
        this.inputManager = new InputManager(this);
        this.renderManager = new RenderManager(this.canvas, this.ctx, this);
        this.uiManager = new UIManager(this);
        this.playerManager = new PlayerManager();
        this.staminaSystem = new StaminaSystem();
        this.interactionManager = new InteractionManager(this);
        
        // Game state
        this.myPlayer = null;
        this.currentUser = null;
        this.isLoading = true;
        
        this.init();
    }
    
    async init() {
        this.loadingScreen.show();
        
        try {
            await this.authManager.verifyAuthentication();
            this.currentUser = this.authManager.getCurrentUser();
            
            this.setupEventListeners();
            this.renderManager.setupCanvas();
            this.uiManager.setupUI();
            
            await this.networkManager.connect();
            
            // Wait for minimum loading time then hide
            setTimeout(() => {
                this.loadingScreen.hide();
                this.startGameLoop();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            window.location.href = '/auth';
        }
    }
    
    setupEventListeners() {
        this.inputManager.setupInputHandlers();
        window.addEventListener('resize', () => this.renderManager.resizeCanvas());
    }
    
    startGameLoop() {
        const gameLoop = () => {
            this.inputManager.handleInput();
            this.staminaSystem.update();
            this.playerManager.update();
            this.interactionManager.update();
            this.renderManager.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    // Public API for other modules
    getMyPlayer() { return this.myPlayer; }
    setMyPlayer(player) { this.myPlayer = player; }
    getCurrentUser() { return this.currentUser; }
    getCanvas() { return this.canvas; }
    getContext() { return this.ctx; }
    getNetworkManager() { return this.networkManager; }
    getPlayerManager() { return this.playerManager; }
}
