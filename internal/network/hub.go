package network

import (
	"encoding/json"
	"golang-mmo-server/internal/game"
	"sync"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	world      *game.World
	mu         sync.Mutex
}

// NewHub creates a new network hub with initialized world
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		world:      game.NewWorld(),
	}
}

// RegisterClient adds client to registration queue
func (h *Hub) RegisterClient(client *Client) {
	h.register <- client
}

// GetWorld returns the game world instance
func (h *Hub) GetWorld() *game.World {
	return h.world
}

// Run starts the hub event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

// BroadcastToAll sends message to all connected clients
func (h *Hub) BroadcastToAll(message map[string]interface{}) {
	data, err := json.Marshal(message)
	if err != nil {
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	for client := range h.clients {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
			delete(h.clients, client)
		}
	}
}

// BroadcastPlayerJoined announces new player to all clients
func (h *Hub) BroadcastPlayerJoined(player *game.Player) {
	message := map[string]interface{}{
		"type": "player_joined",
		"id":   player.ID,
		"name": player.Name,
		"x":    player.Position.X,
		"y":    player.Position.Y,
	}
	h.BroadcastToAll(message)
}

// BroadcastPlayerLeft announces player departure to all clients
func (h *Hub) BroadcastPlayerLeft(playerID string) {
	message := map[string]interface{}{
		"type": "player_left",
		"id":   playerID,
	}
	h.BroadcastToAll(message)
}

// BroadcastPlayerMoved announces player movement to all clients
func (h *Hub) BroadcastPlayerMoved(player *game.Player) {
	message := map[string]interface{}{
		"type": "player_moved",
		"id":   player.ID,
		"x":    player.Position.X,
		"y":    player.Position.Y,
	}
	h.BroadcastToAll(message)
}
