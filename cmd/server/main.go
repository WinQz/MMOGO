package main

import (
	"fmt"
	"golang-mmo-server/internal/auth"
	"golang-mmo-server/internal/config"
	"golang-mmo-server/internal/network"
	"golang-mmo-server/internal/routes"
	"log"
	"net/http"
	"time"
)

const (
	ColorReset  = "\033[0m"
	ColorRed    = "\033[31m"
	ColorGreen  = "\033[32m"
	ColorYellow = "\033[33m"
	ColorBlue   = "\033[34m"
	ColorPurple = "\033[35m"
	ColorCyan   = "\033[36m"
	ColorWhite  = "\033[37m"
	ColorBold   = "\033[1m"
)

func main() {
	printWelcomeBanner()

	cfg := config.LoadConfig()

	printInfo("🔧 Initializing services...")

	authService, err := auth.NewAuthService("./data/users.db")
	if err != nil {
		printError("❌ Failed to initialize auth service: " + err.Error())
		log.Fatal(err)
	}

	hub := network.NewHub()

	printSuccess("✅ Authentication service initialized with database")
	printSuccess("✅ Network hub created")

	printInfo("🚀 Starting background services...")
	go hub.Run()
	hub.GetWorld().StartGameLoop()

	printSuccess("✅ Network hub running")
	printSuccess("✅ Game world loop started")

	printInfo("🌐 Setting up routes...")
	router := routes.NewRouter(authService, hub)
	router.SetupRoutes()

	printSuccess("✅ Routes configured")

	printServerInfo(cfg)

	printInfo("🎮 Starting MMORPG server...")

	if err := http.ListenAndServe(cfg.Address(), nil); err != nil {
		printError("❌ Failed to start server: " + err.Error())
		log.Fatal(err)
	}
}

// printWelcomeBanner displays the MMORPG server ASCII banner
func printWelcomeBanner() {
	banner := `
	╔═══════════════════════════════════════════════════════════════╗
	║                                                               ║
	║    ██████╗  ██████╗ ██╗      █████╗ ███╗   ██╗ ██████╗        ║
	║   ██╔════╝ ██╔═══██╗██║     ██╔══██╗████╗  ██║██╔════╝        ║
	║   ██║  ███╗██║   ██║██║     ███████║██╔██╗ ██║██║  ███╗       ║
	║   ██║   ██║██║   ██║██║     ██╔══██║██║╚██╗██║██║   ██║       ║
	║   ╚██████╔╝╚██████╔╝███████╗██║  ██║██║ ╚████║╚██████╔╝       ║
	║    ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝        ║
	║                                                               ║
	║                   MMORPG SERVER v1.0.0						║
	║					Developed by WinQz							║
	║                   2D MMORPG Game Style                        ║
	╚═══════════════════════════════════════════════════════════════╝
	`

	fmt.Printf("%s%s%s%s\n", ColorCyan, ColorBold, banner, ColorReset)
	fmt.Printf("%s%s🎯 Welcome to the Golang MMORPG Server!%s\n\n", ColorGreen, ColorBold, ColorReset)
}

// printServerInfo displays server configuration and available endpoints
func printServerInfo(cfg *config.Config) {
	fmt.Printf("\n%s%s📊 SERVER INFORMATION%s\n", ColorBlue, ColorBold, ColorReset)
	fmt.Printf("%s═══════════════════════════════════════════════════════════════%s\n", ColorBlue, ColorReset)

	fmt.Printf("%s🏠 Host:%s           %s%s%s\n", ColorYellow, ColorReset, ColorWhite, cfg.Host, ColorReset)
	fmt.Printf("%s🔌 Port:%s           %s%d%s\n", ColorYellow, ColorReset, ColorWhite, cfg.Port, ColorReset)
	fmt.Printf("%s📍 Address:%s        %s%s%s\n", ColorYellow, ColorReset, ColorWhite, cfg.Address(), ColorReset)
	fmt.Printf("%s⏰ Started at:%s     %s%s%s\n", ColorYellow, ColorReset, ColorWhite, time.Now().Format("2006-01-02 15:04:05"), ColorReset)

	fmt.Printf("\n%s%s🌐 AVAILABLE ENDPOINTS%s\n", ColorPurple, ColorBold, ColorReset)
	fmt.Printf("%s═══════════════════════════════════════════════════════════════%s\n", ColorPurple, ColorReset)

	endpoints := []struct {
		method string
		path   string
		desc   string
	}{
		{"GET", "/", "Main game page (protected)"},
		{"GET", "/auth", "Authentication page"},
		{"GET", "/static/*", "Static files (CSS, JS, images)"},
		{"POST", "/api/auth/register", "User registration"},
		{"POST", "/api/auth/login", "User login"},
		{"POST", "/api/auth/logout", "User logout"},
		{"GET", "/api/auth/verify", "Token verification"},
		{"WS", "/ws", "WebSocket game connection"},
		{"GET", "/api/game/world/state", "Get world state"},
		{"POST", "/api/game/player/action", "Player actions"},
	}

	for _, endpoint := range endpoints {
		methodColor := getMethodColor(endpoint.method)
		fmt.Printf("%s%-6s%s %s%-25s%s %s%s%s",
			methodColor, endpoint.method, ColorReset,
			ColorWhite, endpoint.path, ColorReset,
			ColorCyan, endpoint.desc, ColorReset)
	}

	fmt.Printf("\n%s%s🔗 QUICK ACCESS LINKS%s\n", ColorGreen, ColorBold, ColorReset)
	fmt.Printf("%s═══════════════════════════════════════════════════════════════%s\n", ColorGreen, ColorReset)
	fmt.Printf("%s🌍 Game URL:%s      %shttp://%s/auth%s\n", ColorYellow, ColorReset, ColorWhite, cfg.Address(), ColorReset)
	fmt.Printf("%s🎮 Play Game:%s     %shttp://%s/%s\n", ColorYellow, ColorReset, ColorWhite, cfg.Address(), ColorReset)
	fmt.Printf("%s📡 WebSocket:%s     %sws://%s/ws%s\n", ColorYellow, ColorReset, ColorWhite, cfg.Address(), ColorReset)

	fmt.Printf("\n%s%s📋 GAME FEATURES%s\n", ColorCyan, ColorBold, ColorReset)
	fmt.Printf("%s═══════════════════════════════════════════════════════════════%s\n", ColorCyan, ColorReset)

	features := []string{
		"👤 User Authentication & Registration",
		"🎮 Real-time Multiplayer Gameplay",
		"🏃 Player Movement (WASD/Arrow Keys)",
		"💬 Live Chat System",
		"🤖 NPCs (Non-Player Characters)",
		"🎯 Interactive Items",
		"🌍 Persistent Game World",
		"🔄 Auto-reconnection",
		"📱 Responsive Web Interface",
	}

	for i, feature := range features {
		if i%2 == 0 {
			fmt.Printf("%s%-35s", feature, "")
		} else {
			fmt.Printf("%s%s\n", feature, ColorReset)
		}
	}
	if len(features)%2 != 0 {
		fmt.Printf("%s\n", ColorReset)
	}

	fmt.Printf("\n%s%s🎯 INSTRUCTIONS%s\n", ColorYellow, ColorBold, ColorReset)
	fmt.Printf("%s═══════════════════════════════════════════════════════════════%s\n", ColorYellow, ColorReset)
	fmt.Printf("%s1.%s Open your browser and go to: %shttp://%s/auth%s\n", ColorWhite, ColorReset, ColorGreen, cfg.Address(), ColorReset)
	fmt.Printf("%s2.%s Register a new account or login with existing credentials\n", ColorWhite, ColorReset)
	fmt.Printf("%s3.%s Start playing! Use WASD or arrow keys to move around\n", ColorWhite, ColorReset)
	fmt.Printf("%s4.%s Chat with other players and explore the world\n", ColorWhite, ColorReset)

	fmt.Printf("\n%s%s%s", ColorGreen, ColorBold, ColorReset)
}

// getMethodColor returns appropriate color for HTTP method
func getMethodColor(method string) string {
	switch method {
	case "GET":
		return ColorGreen
	case "POST":
		return ColorBlue
	case "PUT":
		return ColorYellow
	case "DELETE":
		return ColorRed
	case "WS":
		return ColorPurple
	default:
		return ColorWhite
	}
}

// printInfo logs info messages with blue formatting
func printInfo(message string) {
	fmt.Printf("%s%s[INFO]%s %s\n", ColorBlue, ColorBold, ColorReset, message)
}

// printSuccess logs success messages with green formatting
func printSuccess(message string) {
	fmt.Printf("%s%s[SUCCESS]%s %s\n", ColorGreen, ColorBold, ColorReset, message)
}

// printError logs error messages with red formatting
func printError(message string) {
	fmt.Printf("%s%s[ERROR]%s %s\n", ColorRed, ColorBold, ColorReset, message)
}
