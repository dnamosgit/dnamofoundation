-- Phase 5: several sites, and more admin accounts.

-- kind 'full' is a site served from here (everything is editable).
-- kind 'popups' is a site hosted elsewhere: it shows pop-ups made here by
-- loading /embed/<embed_key>.js.
ALTER TABLE sites ADD COLUMN kind TEXT NOT NULL DEFAULT 'full';
ALTER TABLE sites ADD COLUMN embed_key TEXT;
CREATE UNIQUE INDEX sites_embed ON sites (embed_key) WHERE embed_key IS NOT NULL;

-- One-time links. kind 'invite' lets a new person create an admin account for
-- that email; kind 'reset' lets an existing admin (user_id) choose a new password.
-- Only a hash of the link's code is stored.
CREATE TABLE invites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('invite', 'reset')),
  email TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
