-- A second site served from here: Dnamo Football Club.
-- template says which set of pages and editable content a 'full' site uses:
-- 'foundation' (the original site) or 'club' (the pages in /public/fc).
ALTER TABLE sites ADD COLUMN template TEXT NOT NULL DEFAULT 'foundation';

-- Until it has its own web address the club site is reached at /fc/.
INSERT INTO sites (slug, name, hostnames, kind, template, created_at)
SELECT 'club', 'Dnamo Football Club', '', 'full', 'club', CAST(strftime('%s', 'now') AS INTEGER)
WHERE NOT EXISTS (SELECT 1 FROM sites WHERE slug = 'club');
