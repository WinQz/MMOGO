package game

import (
	"math"
	"sync"
)

type InteractionType string

const (
	InteractionTrade     InteractionType = "trade"
	InteractionViewStats InteractionType = "view_stats"
	InteractionBlock     InteractionType = "block"
	InteractionFriend    InteractionType = "friend"
)

type PlayerInteraction struct {
	Type    InteractionType `json:"type"`
	Label   string          `json:"label"`
	Icon    string          `json:"icon"`
	Enabled bool            `json:"enabled"`
}

type InteractionRequest struct {
	FromPlayerID string          `json:"from_player_id"`
	ToPlayerID   string          `json:"to_player_id"`
	Type         InteractionType `json:"type"`
	Data         interface{}     `json:"data,omitempty"`
}

type PlayerInteracter struct {
	world               *World
	interactionDistance float64
	mu                  sync.RWMutex
	activeInteractions  map[string]*InteractionRequest // key: requestID
}

func NewPlayerInteracter(world *World) *PlayerInteracter {
	return &PlayerInteracter{
		world:               world,
		interactionDistance: 100.0, // 100 pixels
		activeInteractions:  make(map[string]*InteractionRequest),
	}
}

// GetNearbyPlayers returns players within interaction distance
func (pi *PlayerInteracter) GetNearbyPlayers(playerID string) []*Player {
	pi.mu.RLock()
	defer pi.mu.RUnlock()

	player, exists := pi.world.GetPlayer(playerID)
	if !exists {
		return nil
	}

	var nearbyPlayers []*Player
	for _, otherPlayer := range pi.world.Players {
		if otherPlayer.ID == playerID {
			continue
		}

		distance := pi.calculateDistance(player.Position, otherPlayer.Position)
		if distance <= pi.interactionDistance {
			nearbyPlayers = append(nearbyPlayers, otherPlayer)
		}
	}

	return nearbyPlayers
}

// GetAvailableInteractions returns available interactions for a target player
func (pi *PlayerInteracter) GetAvailableInteractions(fromPlayerID, toPlayerID string) []PlayerInteraction {
	// Check if both players exist
	_, fromExists := pi.world.GetPlayer(fromPlayerID)
	_, toExists := pi.world.GetPlayer(toPlayerID)

	if !fromExists || !toExists {
		return []PlayerInteraction{}
	}

	interactions := []PlayerInteraction{
		{
			Type:    InteractionTrade,
			Label:   "Trade",
			Icon:    "🤝",
			Enabled: true,
		},
		{
			Type:    InteractionViewStats,
			Label:   "View Stats",
			Icon:    "📊",
			Enabled: true,
		},
		{
			Type:    InteractionFriend,
			Label:   "Add Friend",
			Icon:    "👥",
			Enabled: true,
		},
		{
			Type:    InteractionBlock,
			Label:   "Block Player",
			Icon:    "🚫",
			Enabled: true,
		},
	}

	return interactions
}

// ProcessInteraction handles an interaction request
func (pi *PlayerInteracter) ProcessInteraction(request *InteractionRequest) map[string]interface{} {
	pi.mu.Lock()
	defer pi.mu.Unlock()

	fromPlayer, fromExists := pi.world.GetPlayer(request.FromPlayerID)
	toPlayer, toExists := pi.world.GetPlayer(request.ToPlayerID) // Fixed: was getting FromPlayerID twice

	if !fromExists || !toExists {
		return map[string]interface{}{
			"success": false,
			"error":   "Player not found",
		}
	}

	// Check if players are still within interaction distance
	distance := pi.calculateDistance(fromPlayer.Position, toPlayer.Position)
	if distance > pi.interactionDistance {
		return map[string]interface{}{
			"success": false,
			"error":   "Players too far apart",
		}
	}

	switch request.Type {
	case InteractionTrade:
		return pi.handleTradeRequest(request)
	case InteractionViewStats:
		return pi.handleViewStatsRequest(request)
	case InteractionBlock:
		return pi.handleBlockRequest(request)
	case InteractionFriend:
		return pi.handleFriendRequest(request)
	default:
		return map[string]interface{}{
			"success": false,
			"error":   "Unknown interaction type",
		}
	}
}

func (pi *PlayerInteracter) handleTradeRequest(request *InteractionRequest) map[string]interface{} {
	// TODO: Implement trade system
	return map[string]interface{}{
		"success": true,
		"message": "Trade request sent!",
		"action":  "show_trade_window",
	}
}

func (pi *PlayerInteracter) handleViewStatsRequest(request *InteractionRequest) map[string]interface{} {
	toPlayer, exists := pi.world.GetPlayer(request.ToPlayerID)
	if !exists {
		return map[string]interface{}{
			"success": false,
			"error":   "Player not found",
		}
	}

	// Return basic player stats
	stats := map[string]interface{}{
		"name":     toPlayer.Name,
		"level":    1, // TODO: Add level system
		"health":   100,
		"mana":     50,
		"position": toPlayer.Position,
	}

	return map[string]interface{}{
		"success": true,
		"action":  "show_player_stats",
		"stats":   stats,
	}
}

func (pi *PlayerInteracter) handleBlockRequest(request *InteractionRequest) map[string]interface{} {
	// TODO: Implement blocking system
	return map[string]interface{}{
		"success": true,
		"message": "Player blocked successfully",
		"action":  "block_player",
	}
}

func (pi *PlayerInteracter) handleFriendRequest(request *InteractionRequest) map[string]interface{} {
	// TODO: Implement friend system
	return map[string]interface{}{
		"success": true,
		"message": "Friend request sent!",
		"action":  "send_friend_request",
	}
}

func (pi *PlayerInteracter) calculateDistance(pos1, pos2 Position) float64 {
	dx := pos1.X - pos2.X
	dy := pos1.Y - pos2.Y
	return math.Sqrt(dx*dx + dy*dy)
}
