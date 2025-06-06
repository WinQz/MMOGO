package game

import (
	"sync"
)

type Player struct {
	ID       string
	Name     string
	Position Position
	Conn     interface{}
	mu       sync.Mutex
}

// NewPlayer creates a new player with specified ID and name
func NewPlayer(id, name string) *Player {
	return &Player{
		ID:   id,
		Name: name,
		Position: Position{
			X: 0,
			Y: 0,
			Z: 0,
		},
	}
}

// Move updates player position by specified deltas
func (p *Player) Move(x, y, z float64) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Position.X += x
	p.Position.Y += y
	p.Position.Z += z
}

// SendMessage sends message to player's connection
func (p *Player) SendMessage(message []byte) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	type ClientConn interface {
		Send() chan []byte
	}

	if conn, ok := p.Conn.(ClientConn); ok {
		select {
		case conn.Send() <- message:
			return nil
		default:
			return nil
		}
	}
	return nil
}
