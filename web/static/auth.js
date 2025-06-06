class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.messageDiv = document.getElementById('authMessage');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Form switching
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Form submissions
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }
    
    showLoginForm() {
        this.loginForm.classList.add('active');
        this.registerForm.classList.remove('active');
        this.hideMessage();
    }
    
    showRegisterForm() {
        this.registerForm.classList.add('active');
        this.loginForm.classList.remove('active');
        this.hideMessage();
    }
    
    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.querySelector('#loginForm .auth-btn');
        
        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }
        
        this.setLoading(submitBtn, true);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showMessage('Login successful! Redirecting...', 'success');
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', data.username);
                
                // The server should set the cookie automatically,
                // but we'll also redirect to the main page
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }
    
    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.querySelector('#registerForm .auth-btn');
        
        if (!username || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error');
            return;
        }
        
        this.setLoading(submitBtn, true);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showMessage('Registration successful! Please login.', 'success');
                setTimeout(() => {
                    this.showLoginForm();
                }, 2000);
            } else {
                this.showMessage(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }
    
    showMessage(message, type) {
        this.messageDiv.textContent = message;
        this.messageDiv.className = `message ${type}`;
    }
    
    hideMessage() {
        this.messageDiv.className = 'message';
    }
    
    setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}

// Initialize auth manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
