package routes

import (
	"golang-mmo-server/internal/auth"
	"golang-mmo-server/internal/handlers"
	"golang-mmo-server/internal/network"
	"net/http"
)

type Router struct {
	authHandlers *handlers.AuthHandlers
	gameHandlers *handlers.GameHandlers
	hub          *network.Hub
}

func NewRouter(authService *auth.AuthService, hub *network.Hub) *Router {
	return &Router{
		authHandlers: handlers.NewAuthHandlers(authService),
		gameHandlers: handlers.NewGameHandlers(hub),
		hub:          hub,
	}
}

func (r *Router) SetupRoutes() {
	// Serve static files
	r.setupStaticRoutes()

	// Authentication routes
	r.setupAuthRoutes()

	// Game routes
	r.setupGameRoutes()

	// WebSocket routes
	r.setupWebSocketRoutes()
}

func (r *Router) setupStaticRoutes() {
	// Serve static files
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./web/static/"))))

	// Auth page
	http.HandleFunc("/auth", r.serveAuthPage)

	// Protected main page
	http.HandleFunc("/", r.serveMainPage)
}

func (r *Router) setupAuthRoutes() {
	http.HandleFunc("/api/auth/register", r.authHandlers.Register)
	http.HandleFunc("/api/auth/login", r.authHandlers.Login)
	http.HandleFunc("/api/auth/logout", r.authHandlers.Logout)
	http.HandleFunc("/api/auth/verify", r.authHandlers.VerifyToken)
}

func (r *Router) setupGameRoutes() {
	http.HandleFunc("/api/game/player/movement", r.gameHandlers.HandlePlayerMovement)
	http.HandleFunc("/api/game/player/action", r.gameHandlers.HandlePlayerAction)
	http.HandleFunc("/api/game/world/state", r.gameHandlers.GetWorldState)
}

func (r *Router) setupWebSocketRoutes() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, req *http.Request) {
		network.HandleWebSocket(r.hub, w, req)
	})
}

func (r *Router) serveAuthPage(w http.ResponseWriter, req *http.Request) {
	http.ServeFile(w, req, "./web/static/auth.html")
}

func (r *Router) serveMainPage(w http.ResponseWriter, req *http.Request) {
	// For browser requests, check if user has a valid session cookie
	cookie, err := req.Cookie("auth_token")
	if err != nil || cookie.Value == "" {
		// No cookie, redirect to auth
		http.Redirect(w, req, "/auth", http.StatusFound)
		return
	}

	// Validate the session
	if !r.authHandlers.ValidateToken(cookie.Value) {
		// Invalid session, redirect to auth
		http.Redirect(w, req, "/auth", http.StatusFound)
		return
	}

	http.ServeFile(w, req, "./web/static/index.html")
}

func (r *Router) isAuthenticated(req *http.Request) bool {
	// Check for token in Authorization header
	token := req.Header.Get("Authorization")
	if token != "" {
		return r.authHandlers.ValidateToken(token)
	}

	// Check for token in cookies
	cookie, err := req.Cookie("auth_token")
	if err == nil && cookie.Value != "" {
		return r.authHandlers.ValidateToken(cookie.Value)
	}

	// Check localStorage token (handled by frontend)
	return false
}
