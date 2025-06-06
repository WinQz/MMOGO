package game

import (
	"sync"
	"time"
)

type World struct {
	Players          map[string]*Player
	NPCs             map[string]*Entity
	Items            map[string]*Entity
	PlayerInteracter *PlayerInteracter
	mu               sync.RWMutex
}

// NewWorld creates a new game world instance
func NewWorld() *World {
	world := &World{
		Players: make(map[string]*Player),
		NPCs:    make(map[string]*Entity),
		Items:   make(map[string]*Entity),
	}

	world.PlayerInteracter = NewPlayerInteracter(world)
	world.spawnInitialEntities()

	return world
}

// spawnInitialEntities initializes world with entities
func (w *World) spawnInitialEntities() {
}

// AddPlayer adds new player to the world
func (w *World) AddPlayer(player *Player) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.Players[player.ID] = player
}

// RemovePlayer removes player from the world
func (w *World) RemovePlayer(playerID string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	delete(w.Players, playerID)
}

// GetPlayer retrieves player by ID
func (w *World) GetPlayer(playerID string) (*Player, bool) {
	w.mu.Lock()
	defer w.mu.Unlock()
	player, exists := w.Players[playerID]
	return player, exists
}

// GetWorldState returns current world state snapshot
func (w *World) GetWorldState() map[string]interface{} {
	w.mu.RLock()
	defer w.mu.RUnlock()

	players := make([]map[string]interface{}, 0)
	for _, player := range w.Players {
		players = append(players, map[string]interface{}{
			"id":   player.ID,
			"name": player.Name,
			"x":    player.Position.X,
			"y":    player.Position.Y,
		})
	}

	return map[string]interface{}{
		"type":    "world_state",
		"players": players,
		"npcs":    []map[string]interface{}{},
		"items":   []map[string]interface{}{},
	}
}

// Update performs world state updates
func (w *World) Update() {
}

// StartGameLoop begins the main game update loop
func (w *World) StartGameLoop() {
	ticker := time.NewTicker(time.Second)
	go func() {
		for range ticker.C {
			w.Update()
		}
	}()
}
