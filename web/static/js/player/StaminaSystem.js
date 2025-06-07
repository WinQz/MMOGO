export class StaminaSystem {
    constructor() {
        this.stamina = 100;
        this.maxStamina = 100;
        this.canSprint = true;
        this.isRunning = false;
        this.sprintCooldown = false;
        this.lastStaminaUpdate = Date.now();
        this.staminaRegenRate = 20;
        this.staminaDepletionRate = 15;
    }
    
    startSprint() {
        if (this.canSprint && this.stamina > 0) {
            this.isRunning = true;
            console.log('Sprint started - stamina:', this.stamina);
        }
    }
    
    stopSprint() {
        this.isRunning = false;
        console.log('Sprint stopped');
    }
    
    isSprintActive() {
        return this.isRunning && this.canSprint && this.stamina > 0;
    }
    
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastStaminaUpdate) / 1000;
        this.lastStaminaUpdate = now;
        
        if (this.isRunning && this.canSprint && this.stamina > 0) {
            // Deplete stamina while sprinting
            this.stamina -= this.staminaDepletionRate * deltaTime;
            this.stamina = Math.max(0, this.stamina);
            
            // Stop sprinting when stamina reaches 0
            if (this.stamina <= 0) {
                this.canSprint = false;
                this.sprintCooldown = true;
                this.isRunning = false;
                console.log('Stamina depleted - sprint disabled');
            }
        } else {
            // Regenerate stamina when not sprinting
            const regenInterval = 0.5;
            const regenAmount = this.staminaRegenRate;
            
            if (deltaTime >= regenInterval || this.stamina < this.maxStamina) {
                this.stamina += regenAmount * (deltaTime / regenInterval);
                this.stamina = Math.min(this.maxStamina, this.stamina);
            }
            
            // Allow sprinting again when stamina reaches 30%
            if (this.sprintCooldown && this.stamina >= 30) {
                this.canSprint = true;
                this.sprintCooldown = false;
                console.log('Stamina recovered - sprint enabled');
            }
        }
        
        this.updateStaminaDisplay();
    }
    
    updateStaminaDisplay() {
        const staminaElement = document.getElementById('stamina');
        if (staminaElement) {
            staminaElement.textContent = `${Math.floor(this.stamina)}/100`;
        }
        
        const staminaBar = document.getElementById('staminaBar');
        if (staminaBar) {
            const percentage = (this.stamina / this.maxStamina) * 100;
            staminaBar.style.width = `${percentage}%`;
            
            // Change color based on stamina level
            if (percentage <= 25) {
                staminaBar.style.backgroundColor = '#ff4757';
                staminaBar.parentElement.classList.add('stamina-low');
            } else if (percentage <= 50) {
                staminaBar.style.backgroundColor = '#ffa502';
                staminaBar.parentElement.classList.remove('stamina-low');
            } else {
                staminaBar.style.backgroundColor = '#2ed573';
                staminaBar.parentElement.classList.remove('stamina-low');
            }
        }
    }
}
