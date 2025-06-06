package protocol

type MessageType string

const (
    MessageTypeJoin    MessageType = "join"
    MessageTypeLeave   MessageType = "leave"
    MessageTypeMove    MessageType = "move"
    MessageTypeChat    MessageType = "chat"
    MessageTypeUpdate   MessageType = "update"
)

type Message struct {
    Type    MessageType `json:"type"`
    Payload interface{} `json:"payload"`
}

type JoinMessage struct {
    PlayerID string `json:"player_id"`
}

type LeaveMessage struct {
    PlayerID string `json:"player_id"`
}

type MoveMessage struct {
    PlayerID string `json:"player_id"`
    X        float64 `json:"x"`
    Y        float64 `json:"y"`
}

type ChatMessage struct {
    PlayerID string `json:"player_id"`
    Message   string `json:"message"`
}

type UpdateMessage struct {
    Players []PlayerState `json:"players"`
}

type PlayerState struct {
    PlayerID string  `json:"player_id"`
    X        float64 `json:"x"`
    Y        float64 `json:"y"`
}