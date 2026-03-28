const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'danbo.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      filename      TEXT NOT NULL,
      original_name TEXT,
      mime_type     TEXT NOT NULL,
      file_size     INTEGER NOT NULL,
      width         INTEGER,
      height        INTEGER,
      md5           TEXT UNIQUE,
      rating        TEXT NOT NULL DEFAULT 's' CHECK(rating IN ('s','q','e')),
      score         INTEGER NOT NULL DEFAULT 0,
      fav_count     INTEGER NOT NULL DEFAULT 0,
      source        TEXT,
      description   TEXT,
      uploader_ip   TEXT,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS tags (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      category   TEXT NOT NULL DEFAULT 'general'
                 CHECK(category IN ('general','artist','copyright','character','meta')),
      post_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (post_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      voter_ip   TEXT NOT NULL,
      value      INTEGER NOT NULL CHECK(value IN (-1,1)),
      PRIMARY KEY (post_id, voter_ip)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      post_id  INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_ip  TEXT NOT NULL,
      PRIMARY KEY (post_id, user_ip)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_ip   TEXT NOT NULL,
      author_name TEXT NOT NULL DEFAULT 'Anonymous',
      body        TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_posts_created  ON posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_score    ON posts(score DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_rating   ON posts(rating);
    CREATE INDEX IF NOT EXISTS idx_post_tags_tag  ON post_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_tags_name      ON tags(name);
    CREATE INDEX IF NOT EXISTS idx_comments_post  ON comments(post_id);
  `);

  const insert = db.prepare(`INSERT OR IGNORE INTO tags (name, category) VALUES (?, ?)`);
  const seed = db.transaction(rows => { for (const r of rows) insert.run(...r); });
  seed([
    ['highres','meta'],['absurdres','meta'],['ai_generated','meta'],
    ['unknown_artist','artist'],
    ['original','copyright'],['touhou','copyright'],['pokemon','copyright'],
    ['genshin_impact','copyright'],['hololive','copyright'],['blue_archive','copyright'],
    ['meadow_overseer','character'],
  ]);
}

module.exports = { getDb };
