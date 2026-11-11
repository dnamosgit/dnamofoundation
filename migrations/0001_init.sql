-- Phase 1: sites, admin accounts, sessions, login throttling, and the content store.

-- Each website managed from the admin center. hostnames is a comma-separated list.
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hostnames TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

-- Admin accounts. Passwords are stored only as salted PBKDF2 hashes.
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  pass_iter INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Login sessions. Only a hash of the cookie value is stored.
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Failed sign-in attempts, used to lock out repeated guessing.
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  who TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX login_attempts_who ON login_attempts (who, at);

-- Editable content: one JSON value per site and key (filled in from phase 2).
CREATE TABLE content (
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by INTEGER,
  PRIMARY KEY (site_id, key)
);

INSERT INTO sites (slug, name, hostnames, created_at)
VALUES ('foundation', 'Dnamo Football Foundation', '', CAST(strftime('%s', 'now') AS INTEGER));
