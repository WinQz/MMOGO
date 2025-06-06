# Golang MMO Server

## Overview
This project is a multiplayer online game (MMO) server built using Go. It utilizes WebSocket for real-time communication between the server and clients. The server manages game state, player interactions, and broadcasts messages to connected clients.

## Project Structure
```
golang-mmo-server
├── cmd
│   └── server
│       └── main.go          # Entry point of the server application
├── internal
│   ├── game
│   │   ├── player.go        # Player struct and methods
│   │   ├── world.go         # Game world management
│   │   └── entities.go      # Game entities and behaviors
│   ├── network
│   │   ├── websocket.go      # WebSocket connection handling
│   │   ├── client.go         # Client struct for connected players
│   │   └── hub.go            # Manages active WebSocket connections
│   ├── handlers
│   │   └── game_handlers.go   # Game-related request handlers
│   └── config
│       └── config.go         # Server configuration management
├── pkg
│   ├── protocol
│   │   └── messages.go       # Message structures for communication
│   └── utils
│       └── logger.go         # Logging utility functions
├── web
│   ├── static
│   │   ├── index.html        # Main HTML file for the client
│   │   ├── client.js         # Client-side JavaScript
│   │   └── style.css         # Client-side styles
│   └── templates             # Additional HTML templates
├── go.mod                    # Go module definition
├── go.sum                    # Module dependency checksums
└── README.md                 # Project documentation
```

## Getting Started

### Prerequisites
- Go 1.16 or later
- WebSocket-compatible browser

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/golang-mmo-server.git
   cd golang-mmo-server
   ```

2. Install dependencies:
   ```
   go mod tidy
   ```

### Running the Server
To start the server, navigate to the `cmd/server` directory and run:
```
go run main.go
```

### Client Usage
Open `web/static/index.html` in a WebSocket-compatible browser to connect to the server and start playing.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License
This project is licensed under the MIT License. See the LICENSE file for details.