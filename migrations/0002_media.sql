-- Phase 2: uploaded photos. Files are kept in the database (each is shrunk in the
-- browser before upload, so they stay well under the database's per-row size limit).
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  data BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  created_by INTEGER
);
CREATE INDEX media_site ON media (site_id, created_at);
