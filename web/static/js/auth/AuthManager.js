export class AuthManager {
    constructor() {
        this.currentUser = null;
    }
    
    async verifyAuthentication() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            const data = await response.json();
            this.currentUser = {
                username: data.username,
                token: token
            };

            const nameDisplay = document.getElementById('nameDisplay');
            if (nameDisplay) {
                nameDisplay.textContent = data.username;
            }

            return this.currentUser;
        } catch (error) {
            localStorage.removeItem('authToken');
            throw error;
        }
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = '/auth';
    }
}
