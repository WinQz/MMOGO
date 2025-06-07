package network

import (
	"encoding/json"
	"fmt"
	"golang-mmo-server/internal/game"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan []byte
	Player *game.Player
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// NewClient creates a new client connection
func NewClient(conn *websocket.Conn, hub *Hub) *Client {
	return &Client{
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
	}
}

// Listen starts read and write pumps for client
func (c *Client) Listen() {
	go c.writePump(&sync.WaitGroup{})
	go c.readPump()
}

// readMessages handles incoming client messages
func (c *Client) readMessages() {
	c.readPump()
}

// writeMessages handles outgoing client messages
func (c *Client) writeMessages() {
	wg := &sync.WaitGroup{}
	wg.Add(1)
	c.writePump(wg)
}

// readPump handles websocket message reading
func (c *Client) readPump() {
	defer func() {
		if c.Player != nil {
			c.Hub.world.RemovePlayer(c.Player.ID)
			c.Hub.BroadcastPlayerLeft(c.Player.ID)
		}
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		c.handleGameMessage(message)
	}
}

// handleGameMessage processes incoming game messages by type
func (c *Client) handleGameMessage(message []byte) {
	var gameMessage map[string]interface{}
	if err := json.Unmarshal(message, &gameMessage); err != nil {
		log.Printf("Error parsing game message: %v", err)
		return
	}

	msgType, ok := gameMessage["type"].(string)
	if !ok {
		return
	}

	switch msgType {
	case "join":
		c.handleJoin(gameMessage)
	case "move":
		c.handleMove(gameMessage)
	case "chat":
		c.handleChat(gameMessage)
	case "interact":
		c.handleInteract(gameMessage)
	case "player_interact":
		c.handlePlayerInteract(gameMessage)
	case "get_nearby_players":
		c.handleGetNearbyPlayers(gameMessage)
	}
}

// handleJoin processes player join requests
func (c *Client) handleJoin(data map[string]interface{}) {
	name, _ := data["name"].(string)
	token, _ := data["token"].(string)
	x, _ := data["x"].(float64)
	y, _ := data["y"].(float64)

	// Verify the token if provided
	if token != "" {
		// You'll need to pass the auth service to verify the token
		// For now, we'll trust the client's username
	}

	if name == "" {
		name = "Guest"
	}

	playerID := c.generatePlayerID()
	c.Player = game.NewPlayer(playerID, name)
	c.Player.Position.X = x
	c.Player.Position.Y = y
	c.Player.Conn = c

	c.Hub.world.AddPlayer(c.Player)

	// Send player their own info
	response := map[string]interface{}{
		"type": "your_player",
		"id":   c.Player.ID,
		"name": c.Player.Name,
		"x":    c.Player.Position.X,
		"y":    c.Player.Position.Y,
	}
	c.sendJSON(response)

	// Send world state
	c.sendJSON(c.Hub.world.GetWorldState())

	// Broadcast new player to others
	c.Hub.BroadcastPlayerJoined(c.Player)
}

// handleMove validates and processes player movement
func (c *Client) handleMove(data map[string]interface{}) {
	if c.Player == nil {
		return
	}

	x, _ := data["x"].(float64)
	y, _ := data["y"].(float64)
	sprinting, _ := data["sprinting"].(bool)

	// Smooth position validation
	oldX, oldY := c.Player.Position.X, c.Player.Position.Y
	maxMoveDistance := 50.0 // Prevent teleporting/cheating

	deltaX := x - oldX
	deltaY := y - oldY
	distance := deltaX*deltaX + deltaY*deltaY

	if distance > maxMoveDistance*maxMoveDistance {
		// Movement too large, reject
		return
	}

	c.Player.Position.X = x
	c.Player.Position.Y = y

	// Update sprint status and stamina
	c.Player.UpdateSprint(sprinting)

	// Broadcast movement to all players immediately
	c.Hub.BroadcastPlayerMoved(c.Player)
}

// handleChat processes and broadcasts chat messages
func (c *Client) handleChat(data map[string]interface{}) {
	if c.Player == nil {
		return
	}

	message, _ := data["message"].(string)
	if message == "" {
		return
	}

	chatMessage := map[string]interface{}{
		"type":    "chat_message",
		"name":    c.Player.Name,
		"message": message,
	}

	c.Hub.BroadcastToAll(chatMessage)
}

// handleInteract processes general interaction requests
func (c *Client) handleInteract(data map[string]interface{}) {
	// Handle item interaction, NPC interaction, etc.
	log.Printf("Player %s interacted at position", c.Player.Name)
}

// handlePlayerInteract processes player-to-player interactions
func (c *Client) handlePlayerInteract(data map[string]interface{}) {
	if c.Player == nil {
		return
	}

	toPlayerID, _ := data["to_player_id"].(string)
	interactionType, _ := data["interaction_type"].(string)

	log.Printf("Player %s trying to interact with %s using %s", c.Player.Name, toPlayerID, interactionType)

	if toPlayerID == "" || interactionType == "" {
		return
	}

	request := &game.InteractionRequest{
		FromPlayerID: c.Player.ID,
		ToPlayerID:   toPlayerID,
		Type:         game.InteractionType(interactionType),
		Data:         data["data"],
	}

	result := c.Hub.world.PlayerInteracter.ProcessInteraction(request)

	log.Printf("Interaction result: %+v", result)

	// Send result back to client
	response := map[string]interface{}{
		"type":   "interaction_result",
		"result": result,
	}
	c.sendJSON(response)
}

// handleGetNearbyPlayers returns nearby players with interaction options
func (c *Client) handleGetNearbyPlayers(data map[string]interface{}) {
	if c.Player == nil {
		return
	}

	nearbyPlayers := c.Hub.world.PlayerInteracter.GetNearbyPlayers(c.Player.ID)

	log.Printf("Player %s checking nearby players, found %d", c.Player.Name, len(nearbyPlayers))

	playersData := make([]map[string]interface{}, 0)
	for _, player := range nearbyPlayers {
		interactions := c.Hub.world.PlayerInteracter.GetAvailableInteractions(c.Player.ID, player.ID)

		log.Printf("Player %s is nearby %s with %d interactions", c.Player.Name, player.Name, len(interactions))

		playersData = append(playersData, map[string]interface{}{
			"id":           player.ID,
			"name":         player.Name,
			"x":            player.Position.X,
			"y":            player.Position.Y,
			"interactions": interactions,
		})
	}

	response := map[string]interface{}{
		"type":           "nearby_players",
		"nearby_players": playersData,
	}
	c.sendJSON(response)
}

// sendJSON marshals and sends JSON data to client
func (c *Client) sendJSON(data interface{}) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return
	}

	select {
	case c.Send <- jsonData:
	default:
		// Channel full
	}
}

// generatePlayerID creates unique player identifier
func (c *Client) generatePlayerID() string {
	return fmt.Sprintf("player_%d", time.Now().UnixNano())
}

// writePump handles websocket message writing
func (c *Client) writePump(wg *sync.WaitGroup) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
		wg.Done()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.Conn.WriteMessage(websocket.TextMessage, message)
		case <-ticker.C:
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
