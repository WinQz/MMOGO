package handlers

import (
	"encoding/json"
	"golang-mmo-server/internal/auth"
	"net/http"
	"strings"
)

type AuthHandlers struct {
	authService *auth.AuthService
}

func NewAuthHandlers(authService *auth.AuthService) *AuthHandlers {
	return &AuthHandlers{
		authService: authService,
	}
}

func (ah *AuthHandlers) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Username == "" || req.Email == "" || req.Password == "" {
		writeErrorResponse(w, "All fields are required", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 6 {
		writeErrorResponse(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	user, err := ah.authService.Register(req.Username, req.Email, req.Password)
	if err != nil {
		writeErrorResponse(w, err.Error(), http.StatusConflict)
		return
	}

	writeSuccessResponse(w, map[string]interface{}{
		"message": "Registration successful",
		"user":    user,
	})
}

func (ah *AuthHandlers) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		writeErrorResponse(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	session, err := ah.authService.Login(req.Username, req.Password)
	if err != nil {
		writeErrorResponse(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Set HTTP-only cookie for web security
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    session.Token,
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteStrictMode,
		Path:     "/",
	})

	writeSuccessResponse(w, map[string]interface{}{
		"message":  "Login successful",
		"token":    session.Token,
		"username": session.Username,
	})
}

func (ah *AuthHandlers) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := ah.extractToken(r)
	if token != "" {
		ah.authService.Logout(token)
	}

	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		HttpOnly: true,
		MaxAge:   -1,
		Path:     "/",
	})

	writeSuccessResponse(w, map[string]string{
		"message": "Logout successful",
	})
}

func (ah *AuthHandlers) VerifyToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token := ah.extractToken(r)
	if token == "" {
		writeErrorResponse(w, "No token provided", http.StatusUnauthorized)
		return
	}

	session, err := ah.authService.ValidateSession(token)
	if err != nil {
		writeErrorResponse(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	writeSuccessResponse(w, map[string]interface{}{
		"valid":    true,
		"username": session.Username,
	})
}

func (ah *AuthHandlers) ValidateToken(token string) bool {
	_, err := ah.authService.ValidateSession(token)
	return err == nil
}

// ExtractToken extracts token from request (public method)
func (ah *AuthHandlers) ExtractToken(r *http.Request) string {
	// Try Authorization header first
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		if strings.HasPrefix(authHeader, "Bearer ") {
			return strings.TrimPrefix(authHeader, "Bearer ")
		}
		return authHeader
	}

	// Try cookie
	cookie, err := r.Cookie("auth_token")
	if err == nil {
		return cookie.Value
	}

	return ""
}

func (ah *AuthHandlers) extractToken(r *http.Request) string {
	// Keep the private method for internal use and call the public one
	return ah.ExtractToken(r)
}

func writeErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func writeSuccessResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
