package game

type EntityType int

const (
	NPC EntityType = iota
	Item
)

type Entity struct {
	ID       string
	Type     EntityType
	Name     string
	Position Position
}

type Position struct {
	X float64
	Y float64
	Z float64
}

// Move updates entity position to new coordinates
func (e *Entity) Move(newPosition Position) {
	e.Position = newPosition
}

// NewEntity creates a new entity with specified properties
func NewEntity(id string, entityType EntityType, name string, position Position) *Entity {
	return &Entity{
		ID:       id,
		Type:     entityType,
		Name:     name,
		Position: position,
	}
}
