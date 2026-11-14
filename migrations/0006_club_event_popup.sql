-- The club site's upcoming event is a pop-up on its home page (a wide card in
-- the corner), not a section of the page. This adds the first one, once.
INSERT INTO popups (site_id, enabled, starts_at, ends_at, data, created_at, updated_at, updated_by)
SELECT s.id, 1, NULL, NULL,
  '{"title":"Thanksgiving Camp","text":"Our Thanksgiving Soccer Camp keeps players active and engaged during the holiday break with fun, high-energy drills and small-sided games, led by our professional coaches.","image":"/hero-2.jpg","label":"Upcoming event","layout":"wide","button":{"label":"Register now","href":"https://dnamofc.byga.net/programs/hj15224m1v/signup"},"pages":["index.html"],"frequency":"always","delay":1}',
  CAST(strftime('%s', 'now') AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER), NULL
FROM sites s
WHERE s.slug = 'club' AND NOT EXISTS (SELECT 1 FROM popups p WHERE p.site_id = s.id);
