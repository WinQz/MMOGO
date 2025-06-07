package game

import (
	"sync"
	"time"
)

// PlayerStamina manages player stamina and sprint mechanics
type PlayerStamina struct {
	Current    float64   `json:"current"`
	Max        float64   `json:"max"`
	CanSprint  bool      `json:"can_sprint"`
	IsRunning  bool      `json:"is_running"`
	LastUpdate time.Time `json:"-"`
	mu         sync.Mutex
}

// NewPlayerStamina creates a new stamina system for a player
func NewPlayerStamina() *PlayerStamina {
	return &PlayerStamina{
		Current:    100.0,
		Max:        100.0,
		CanSprint:  true,
		IsRunning:  false,
		LastUpdate: time.Now(),
	}
}

// Update processes stamina regeneration and depletion
func (ps *PlayerStamina) Update(isRunning bool) {
	ps.mu.Lock()
	defer ps.mu.Unlock()

	now := time.Now()
	deltaTime := now.Sub(ps.LastUpdate).Seconds()
	ps.LastUpdate = now

	if isRunning && ps.CanSprint && ps.Current > 0 {
		// Deplete stamina while sprinting (15 per second)
		ps.Current -= 15.0 * deltaTime
		ps.Current = max(0, ps.Current)
		ps.IsRunning = true

		// Stop sprinting when stamina reaches 0
		if ps.Current <= 0 {
			ps.CanSprint = false
			ps.IsRunning = false
		}
	} else {
		// Regenerate stamina when not sprinting (20% every 0.5 seconds)
		regenRate := 40.0 // 20% per 0.5 seconds = 40% per second
		ps.Current += regenRate * deltaTime
		ps.Current = min(ps.Max, ps.Current)
		ps.IsRunning = false

		// Allow sprinting again when stamina reaches 30%
		if ps.Current >= 30.0 {
			ps.CanSprint = true
		}
	}
}

// CanPlayerSprint checks if player can currently sprint
func (ps *PlayerStamina) CanPlayerSprint() bool {
	ps.mu.Lock()
	defer ps.mu.Unlock()
	return ps.CanSprint && ps.Current > 0
}

// GetStamina returns current stamina values
func (ps *PlayerStamina) GetStamina() (current, max float64, canSprint bool) {
	ps.mu.Lock()
	defer ps.mu.Unlock()
	return ps.Current, ps.Max, ps.CanSprint
}

type Player struct {
	ID       string
	Name     string
	Position Position
	Stamina  *PlayerStamina
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
		Stamina: NewPlayerStamina(),
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

// UpdateSprint processes sprint status and stamina
func (p *Player) UpdateSprint(isSprinting bool) {
	if p.Stamina != nil {
		p.Stamina.Update(isSprinting)
	}
}

// CanSprint returns whether player can currently sprint
func (p *Player) CanSprint() bool {
	if p.Stamina != nil {
		return p.Stamina.CanPlayerSprint()
	}
	return false
}

// GetStaminaInfo returns stamina information
func (p *Player) GetStaminaInfo() (current, max float64, canSprint bool) {
	if p.Stamina != nil {
		return p.Stamina.GetStamina()
	}
	return 100.0, 100.0, true
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

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}
