-- Small per-site values the server keeps for itself (not edited by hand):
-- the latest Instagram posts for a gallery, and the renewed Instagram access token.
CREATE TABLE settings (
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (site_id, key)
);
