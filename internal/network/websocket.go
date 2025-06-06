package network

import (
	"log"
	"net/http"
)

// HandleWebSocket upgrades HTTP connection to WebSocket and registers client
func HandleWebSocket(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{
		Hub:  hub,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	hub.RegisterClient(client)

	go client.writeMessages()
	go client.readMessages()
}
