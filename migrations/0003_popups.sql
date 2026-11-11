-- Phase 4: pop-ups. What a pop-up says is kept as JSON in "data"; the on/off
-- switch and the dates are columns so the live ones can be picked out quickly.
-- Dates are seconds since 1970 (UTC); NULL means "no start" or "no end".
CREATE TABLE popups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0,
  starts_at INTEGER,
  ends_at INTEGER,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by INTEGER
);
CREATE INDEX popups_site ON popups (site_id, enabled);
