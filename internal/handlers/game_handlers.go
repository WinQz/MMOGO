package handlers

import (
	"encoding/json"
	"net/http"

	"golang-mmo-server/internal/network"
)

type GameHandlers struct {
	hub *network.Hub
}

func NewGameHandlers(hub *network.Hub) *GameHandlers {
	return &GameHandlers{
		hub: hub,
	}
}

func (gh *GameHandlers) HandlePlayerMovement(w http.ResponseWriter, r *http.Request) {
	// Use existing network infrastructure
	network.HandleWebSocket(gh.hub, w, r)
}

func (gh *GameHandlers) HandlePlayerAction(w http.ResponseWriter, r *http.Request) {
	// Simple action structure
	var action struct {
		PlayerID string  `json:"player_id"`
		Type     string  `json:"type"`
		X        float64 `json:"x"`
		Y        float64 `json:"y"`
		Z        float64 `json:"z"`
		TargetID string  `json:"target_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&action); err != nil {
		http.Error(w, "Invalid action", http.StatusBadRequest)
		return
	}

	// Create a simple world instance
	world := gh.hub.GetWorld()
	player, exists := world.GetPlayer(action.PlayerID)
	if !exists {
		http.Error(w, "Player not found", http.StatusNotFound)
		return
	}

	// Process the action
	switch action.Type {
	case "move":
		player.Move(action.X, action.Y, action.Z)
		gh.hub.BroadcastPlayerMoved(player)
	default:
		http.Error(w, "Unknown action type", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (gh *GameHandlers) GetWorldState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	worldState := gh.hub.GetWorld().GetWorldState()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(worldState)
}
