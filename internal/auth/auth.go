package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       string    `json:"id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Password string    `json:"-"` // Don't serialize password
	Created  time.Time `json:"created"`
}

type Session struct {
	Token    string    `json:"token"`
	UserID   string    `json:"user_id"`
	Username string    `json:"username"`
	Created  time.Time `json:"created"`
	Expires  time.Time `json:"expires"`
}

type AuthService struct {
	db *Database
}

func NewAuthService(dbPath string) (*AuthService, error) {
	db, err := NewDatabase(dbPath)
	if err != nil {
		return nil, err
	}

	// Clean expired sessions on startup
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		for range ticker.C {
			db.CleanExpiredSessions()
		}
	}()

	return &AuthService{db: db}, nil
}

func (as *AuthService) Register(username, email, password string) (*User, error) {
	// Check if user already exists
	if _, err := as.db.GetUserByUsername(username); err == nil {
		return nil, errors.New("username already exists")
	}

	if _, err := as.db.GetUserByEmail(email); err == nil {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &User{
		ID:       generateID(),
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
		Created:  time.Now(),
	}

	if err := as.db.CreateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (as *AuthService) Login(username, password string) (*Session, error) {
	user, err := as.db.GetUserByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Create session
	session := &Session{
		Token:    generateToken(),
		UserID:   user.ID,
		Username: user.Username,
		Created:  time.Now(),
		Expires:  time.Now().Add(24 * time.Hour), // 24 hour sessions
	}

	if err := as.db.CreateSession(session); err != nil {
		return nil, err
	}

	return session, nil
}

func (as *AuthService) ValidateSession(token string) (*Session, error) {
	session, err := as.db.GetSession(token)
	if err != nil {
		return nil, errors.New("invalid session")
	}

	if time.Now().After(session.Expires) {
		as.db.DeleteSession(token)
		return nil, errors.New("session expired")
	}

	return session, nil
}

func (as *AuthService) Logout(token string) {
	as.db.DeleteSession(token)
}

func (as *AuthService) GetUserFromSession(token string) (*User, error) {
	session, err := as.ValidateSession(token)
	if err != nil {
		return nil, err
	}

	return as.db.GetUserByUsername(session.Username)
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func generateToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
