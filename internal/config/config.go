package config

import (
	"fmt"
)

type Config struct {
	Host        string `json:"host"`
	Port        int    `json:"port"`
	DatabaseURL string `json:"database_url"`
	RedisURL    string `json:"redis_url"`
	LogLevel    string `json:"log_level"`
}

// Address returns formatted host:port address
func (c *Config) Address() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// LoadConfig returns default configuration settings
func LoadConfig() *Config {
	return &Config{
		Host: "localhost",
		Port: 8080,
	}
}
