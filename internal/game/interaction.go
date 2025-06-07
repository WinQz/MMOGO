package game

import (
	"math"
	"sync"
)

type InteractionType string

const (
	ViewStats   InteractionType = "view_stats"
	Trade       InteractionType = "trade"
	Challenge   InteractionType = "challenge"
	SendMessage InteractionType = "send_message"
	AddFriend   InteractionType = "add_friend"
	Block       InteractionType = "block"
)

type InteractionRequest struct {
	FromPlayerID string
	ToPlayerID   string
	Type         InteractionType
	Data         interface{}
}

type InteractionResult struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Action  string      `json:"action,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type InteractionOption struct {
	Type    string `json:"type"`
	Label   string `json:"label"`
	Icon    string `json:"icon"`
	Enabled bool   `json:"enabled"`
}

type PlayerInteracter struct {
	world              *World
	interactionRadius  float64
	activeInteractions map[string]*InteractionRequest
	mu                 sync.RWMutex
}

func NewPlayerInteracter(world *World) *PlayerInteracter {
	return &PlayerInteracter{
		world:              world,
		interactionRadius:  150.0, // Distance within which players can interact
		activeInteractions: make(map[string]*InteractionRequest),
	}
}

func (pi *PlayerInteracter) GetNearbyPlayers(playerID string) []*Player {
	pi.mu.RLock()
	defer pi.mu.RUnlock()

	player, exists := pi.world.GetPlayer(playerID)
	if !exists {
		return []*Player{}
	}

	var nearbyPlayers []*Player
	for _, otherPlayer := range pi.world.Players {
		if otherPlayer.ID == playerID {
			continue
		}

		distance := pi.calculateDistance(player.Position, otherPlayer.Position)
		if distance <= pi.interactionRadius {
			nearbyPlayers = append(nearbyPlayers, otherPlayer)
		}
	}

	return nearbyPlayers
}

func (pi *PlayerInteracter) GetAvailableInteractions(fromPlayerID, toPlayerID string) []InteractionOption {
	// Check if both players exist
	_, fromExists := pi.world.GetPlayer(fromPlayerID)
	_, toExists := pi.world.GetPlayer(toPlayerID)

	if !fromExists || !toExists {
		return []InteractionOption{}
	}

	// Basic interactions available to all players
	return []InteractionOption{
		{
			Type:    string(ViewStats),
			Label:   "View Stats",
			Icon:    "📊",
			Enabled: true,
		},
		{
			Type:    string(Trade),
			Label:   "Trade Items",
			Icon:    "🤝",
			Enabled: true,
		},
		{
			Type:    string(Challenge),
			Label:   "Challenge to Duel",
			Icon:    "⚔️",
			Enabled: true,
		},
		{
			Type:    string(SendMessage),
			Label:   "Send Message",
			Icon:    "💬",
			Enabled: true,
		},
		{
			Type:    string(AddFriend),
			Label:   "Add Friend",
			Icon:    "👥",
			Enabled: true,
		},
		{
			Type:    string(Block),
			Label:   "Block Player",
			Icon:    "🚫",
			Enabled: true,
		},
	}
}

func (pi *PlayerInteracter) ProcessInteraction(request *InteractionRequest) *InteractionResult {
	pi.mu.Lock()
	defer pi.mu.Unlock()

	fromPlayer, fromExists := pi.world.GetPlayer(request.FromPlayerID)
	toPlayer, toExists := pi.world.GetPlayer(request.ToPlayerID)

	if !fromExists || !toExists {
		return &InteractionResult{
			Success: false,
			Message: "Player not found",
			Error:   "Player not found",
		}
	}

	// Check if players are within interaction range
	distance := pi.calculateDistance(fromPlayer.Position, toPlayer.Position)
	if distance > pi.interactionRadius {
		return &InteractionResult{
			Success: false,
			Message: "Player is too far away",
			Error:   "Players too far apart",
		}
	}

	switch request.Type {
	case ViewStats:
		return pi.handleViewStats(fromPlayer, toPlayer)
	case Trade:
		return pi.handleTrade(fromPlayer, toPlayer)
	case Challenge:
		return pi.handleChallenge(fromPlayer, toPlayer)
	case SendMessage:
		return pi.handleSendMessage(fromPlayer, toPlayer, request.Data)
	case AddFriend:
		return pi.handleAddFriend(fromPlayer, toPlayer)
	case Block:
		return pi.handleBlock(fromPlayer, toPlayer)
	default:
		return &InteractionResult{
			Success: false,
			Message: "Unknown interaction type",
			Error:   "Unknown interaction type",
		}
	}
}

func (pi *PlayerInteracter) handleViewStats(fromPlayer, toPlayer *Player) *InteractionResult {
	current, max, canSprint := toPlayer.GetStaminaInfo()

	stats := map[string]interface{}{
		"player_name": toPlayer.Name,
		"player_id":   toPlayer.ID,
		"level":       1, // TODO: Add level system
		"position": map[string]float64{
			"x": toPlayer.Position.X,
			"y": toPlayer.Position.Y,
		},
		"stats": map[string]interface{}{
			"health":      100,
			"max_health":  100,
			"mana":        50,
			"max_mana":    50,
			"stamina":     current,
			"max_stamina": max,
			"can_sprint":  canSprint,
		},
		"attributes": map[string]int{
			"strength":     10,
			"agility":      8,
			"intelligence": 12,
			"defense":      6,
		},
	}

	return &InteractionResult{
		Success: true,
		Message: "Stats viewed successfully",
		Action:  "show_player_stats",
		Data:    stats,
	}
}

func (pi *PlayerInteracter) handleTrade(fromPlayer, toPlayer *Player) *InteractionResult {
	return &InteractionResult{
		Success: true,
		Message: "Trade request sent!",
		Action:  "show_trade_window",
		Data: map[string]interface{}{
			"trade_initiated": true,
			"from_player":     fromPlayer.Name,
			"to_player":       toPlayer.Name,
		},
	}
}

func (pi *PlayerInteracter) handleChallenge(fromPlayer, toPlayer *Player) *InteractionResult {
	return &InteractionResult{
		Success: true,
		Message: "Duel challenge sent",
		Action:  "send_duel_challenge",
		Data: map[string]interface{}{
			"challenge_sent": true,
			"challenger":     fromPlayer.Name,
			"challenged":     toPlayer.Name,
		},
	}
}

func (pi *PlayerInteracter) handleSendMessage(fromPlayer, toPlayer *Player, data interface{}) *InteractionResult {
	return &InteractionResult{
		Success: true,
		Message: "Message sent",
		Action:  "send_private_message",
		Data: map[string]interface{}{
			"message_sent": true,
			"from":         fromPlayer.Name,
			"to":           toPlayer.Name,
		},
	}
}

func (pi *PlayerInteracter) handleAddFriend(fromPlayer, toPlayer *Player) *InteractionResult {
	return &InteractionResult{
		Success: true,
		Message: "Friend request sent!",
		Action:  "send_friend_request",
		Data: map[string]interface{}{
			"friend_request_sent": true,
			"from":                fromPlayer.Name,
			"to":                  toPlayer.Name,
		},
	}
}

func (pi *PlayerInteracter) handleBlock(fromPlayer, toPlayer *Player) *InteractionResult {
	// TODO: Implement blocking system with persistent storage
	return &InteractionResult{
		Success: true,
		Message: "Player blocked successfully",
		Action:  "block_player",
		Data: map[string]interface{}{
			"blocked_player": toPlayer.Name,
			"blocker":        fromPlayer.Name,
		},
	}
}

func (pi *PlayerInteracter) calculateDistance(pos1, pos2 Position) float64 {
	dx := pos1.X - pos2.X
	dy := pos1.Y - pos2.Y
	return math.Sqrt(dx*dx + dy*dy)
}

// Additional helper methods from player_interacter.go

// IsPlayerBlocked checks if a player is blocked by another
func (pi *PlayerInteracter) IsPlayerBlocked(playerID, targetID string) bool {
	// TODO: Implement blocking check with persistent storage
	return false
}

// GetActiveInteractions returns all active interactions for a player
func (pi *PlayerInteracter) GetActiveInteractions(playerID string) []*InteractionRequest {
	pi.mu.RLock()
	defer pi.mu.RUnlock()

	var interactions []*InteractionRequest
	for _, interaction := range pi.activeInteractions {
		if interaction.FromPlayerID == playerID || interaction.ToPlayerID == playerID {
			interactions = append(interactions, interaction)
		}
	}
	return interactions
}

// AddActiveInteraction adds an interaction to the active list
func (pi *PlayerInteracter) AddActiveInteraction(requestID string, request *InteractionRequest) {
	pi.mu.Lock()
	defer pi.mu.Unlock()
	pi.activeInteractions[requestID] = request
}

// RemoveActiveInteraction removes an interaction from the active list
func (pi *PlayerInteracter) RemoveActiveInteraction(requestID string) {
	pi.mu.Lock()
	defer pi.mu.Unlock()
	delete(pi.activeInteractions, requestID)
}
