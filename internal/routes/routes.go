package routes

import (
	"golang-mmo-server/internal/auth"
	"golang-mmo-server/internal/handlers"
	"golang-mmo-server/internal/network"
	"net/http"
	"strings"
)

type Router struct {
	authService *auth.AuthService
	hub         *network.Hub
	authHandler *handlers.AuthHandlers
}

func NewRouter(authService *auth.AuthService, hub *network.Hub) *Router {
	return &Router{
		authService: authService,
		hub:         hub,
		authHandler: handlers.NewAuthHandlers(authService),
	}
}

func (router *Router) SetupRoutes() {
	// Static files with proper MIME types
	router.setupStaticRoutes()

	// Authentication routes
	router.setupAuthRoutes()

	// Game routes
	router.setupGameRoutes()

	// WebSocket route
	router.setupWebSocketRoute()

	// Main routes
	router.setupMainRoutes()
}

func (router *Router) setupStaticRoutes() {
	// Create a custom file server that sets correct MIME types
	fs := http.FileServer(http.Dir("./web/static/"))

	http.HandleFunc("/static/", func(w http.ResponseWriter, r *http.Request) {
		// Set correct MIME type for JavaScript modules
		if strings.HasSuffix(r.URL.Path, ".js") {
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		} else if strings.HasSuffix(r.URL.Path, ".css") {
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		} else if strings.HasSuffix(r.URL.Path, ".html") {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
		}

		// Add CORS headers for development
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Strip the /static/ prefix and serve
		http.StripPrefix("/static/", fs).ServeHTTP(w, r)
	})
}

func (router *Router) setupAuthRoutes() {
	http.HandleFunc("/api/auth/register", router.authHandler.Register)
	http.HandleFunc("/api/auth/login", router.authHandler.Login)
	http.HandleFunc("/api/auth/logout", router.authHandler.Logout)
	http.HandleFunc("/api/auth/verify", router.authHandler.VerifyToken)
}

func (router *Router) setupGameRoutes() {
	// Game API routes can be added here
	http.HandleFunc("/api/game/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "online", "players": 0}`))
	})
}

func (router *Router) setupWebSocketRoute() {
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		network.HandleWebSocket(router.hub, w, r)
	})
}

func (router *Router) setupMainRoutes() {
	// Auth page (public)
	http.HandleFunc("/auth", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/auth.html")
	})

	// Main game page (protected)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Only serve index.html for root path
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}

		// Check authentication
		token := router.authHandler.ExtractToken(r)
		if token == "" || !router.authHandler.ValidateToken(token) {
			http.Redirect(w, r, "/auth", http.StatusSeeOther)
			return
		}

		http.ServeFile(w, r, "./web/static/index.html")
	})
}
