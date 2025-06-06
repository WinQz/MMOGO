package auth

import (
	"database/sql"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

type Database struct {
	db *sql.DB
}

func NewDatabase(dbPath string) (*Database, error) {
	// Create data directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	database := &Database{db: db}
	if err := database.createTables(); err != nil {
		return nil, err
	}

	return database, nil
}

func (d *Database) createTables() error {
	userTable := `
	CREATE TABLE IF NOT EXISTS users (
		id TEXT PRIMARY KEY,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		created_at DATETIME NOT NULL
	);`

	sessionTable := `
	CREATE TABLE IF NOT EXISTS sessions (
		token TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		username TEXT NOT NULL,
		created_at DATETIME NOT NULL,
		expires_at DATETIME NOT NULL,
		FOREIGN KEY(user_id) REFERENCES users(id)
	);`

	if _, err := d.db.Exec(userTable); err != nil {
		return err
	}

	if _, err := d.db.Exec(sessionTable); err != nil {
		return err
	}

	return nil
}

func (d *Database) CreateUser(user *User) error {
	query := `INSERT INTO users (id, username, email, password, created_at) VALUES (?, ?, ?, ?, ?)`
	_, err := d.db.Exec(query, user.ID, user.Username, user.Email, user.Password, user.Created)
	return err
}

func (d *Database) GetUserByUsername(username string) (*User, error) {
	query := `SELECT id, username, email, password, created_at FROM users WHERE username = ?`
	row := d.db.QueryRow(query, username)

	user := &User{}
	err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.Created)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (d *Database) GetUserByEmail(email string) (*User, error) {
	query := `SELECT id, username, email, password, created_at FROM users WHERE email = ?`
	row := d.db.QueryRow(query, email)

	user := &User{}
	err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.Created)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (d *Database) CreateSession(session *Session) error {
	query := `INSERT INTO sessions (token, user_id, username, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`
	_, err := d.db.Exec(query, session.Token, session.UserID, session.Username, session.Created, session.Expires)
	return err
}

func (d *Database) GetSession(token string) (*Session, error) {
	query := `SELECT token, user_id, username, created_at, expires_at FROM sessions WHERE token = ?`
	row := d.db.QueryRow(query, token)

	session := &Session{}
	err := row.Scan(&session.Token, &session.UserID, &session.Username, &session.Created, &session.Expires)
	if err != nil {
		return nil, err
	}

	return session, nil
}

func (d *Database) DeleteSession(token string) error {
	query := `DELETE FROM sessions WHERE token = ?`
	_, err := d.db.Exec(query, token)
	return err
}

func (d *Database) CleanExpiredSessions() error {
	query := `DELETE FROM sessions WHERE expires_at < ?`
	_, err := d.db.Exec(query, time.Now())
	return err
}

func (d *Database) Close() error {
	return d.db.Close()
}
