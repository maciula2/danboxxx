const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const sharp   = require('sharp');
const { getDb } = require('../db');

const router = express.Router();
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_PATH),
  filename:    (_req, file,  cb) => cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase()),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg','image/png','image/gif','image/webp'].includes(file.mimetype)),
});

// helpers
function applyTags(db, postId, tagNames) {
  const upsert = db.prepare(`INSERT OR IGNORE INTO tags (name, category) VALUES (?, 'general')`);
  const getId  = db.prepare(`SELECT id FROM tags WHERE name = ?`);
  const link   = db.prepare(`INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)`);
  const bump   = db.prepare(`UPDATE tags SET post_count = post_count + 1 WHERE id = ?`);
  db.transaction(names => {
    for (const n of names) { upsert.run(n); const t = getId.get(n); link.run(postId, t.id); bump.run(t.id); }
  })(tagNames);
}

function formatPost(row) {
  const tags = { general:[], artist:[], copyright:[], character:[], meta:[] };
  if (row.tags_raw) {
    for (const entry of row.tags_raw.split('|')) {
      const [name, cat] = entry.split(':');
      if (name && cat && tags[cat]) tags[cat].push(name);
    }
  }
  return {
    id: row.id, filename: row.filename, original_name: row.original_name,
    mime_type: row.mime_type, file_size: row.file_size,
    width: row.width, height: row.height, rating: row.rating,
    score: row.score, fav_count: row.fav_count,
    source: row.source, description: row.description,
    created_at: row.created_at, updated_at: row.updated_at,
    tags,
    file_url:  `/uploads/${row.filename}`,
    thumb_url: `/uploads/thumbs/thumb_${row.filename}`,
  };
}

const WITH_TAGS = `
  SELECT p.*, GROUP_CONCAT(t.name || ':' || t.category, '|') AS tags_raw
  FROM posts p
  LEFT JOIN post_tags pt ON pt.post_id = p.id
  LEFT JOIN tags t ON t.id = pt.tag_id`;

// GET /api/posts
router.get('/', (req, res) => {
  const db     = getDb();
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const order  = { score:'p.score DESC, p.created_at DESC', random:'RANDOM()' }[req.query.order] || 'p.created_at DESC';
  const tagNames = (req.query.tags || '').trim().split(/\s+/).filter(Boolean);

  const where = []; const params = [];
  if (req.query.rating && ['s','q','e'].includes(req.query.rating)) { where.push('p.rating = ?'); params.push(req.query.rating); }
  for (const tag of tagNames) {
    if (tag.startsWith('-')) {
      where.push(`p.id NOT IN (SELECT pt2.post_id FROM post_tags pt2 JOIN tags t2 ON t2.id=pt2.tag_id WHERE t2.name=?)`);
      params.push(tag.slice(1));
    } else {
      where.push(`p.id IN (SELECT pt2.post_id FROM post_tags pt2 JOIN tags t2 ON t2.id=pt2.tag_id WHERE t2.name LIKE ?)`);
      params.push(tag.replace(/\*/g,'%'));
    }
  }
  const W = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM posts p ${W}`).get(...params).c;
  const posts = db.prepare(`${WITH_TAGS} ${W} GROUP BY p.id ORDER BY ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({ posts: posts.map(formatPost), total, page, limit, pages: Math.ceil(total/limit) });
});

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const db   = getDb();
  const post = db.prepare(`${WITH_TAGS} WHERE p.id=? GROUP BY p.id`).get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(formatPost(post));
});

// POST /api/posts
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const db = getDb();
  const { rating='s', source='', tags='', description='' } = req.body;
  if (!['s','q','e'].includes(rating)) return res.status(400).json({ error: 'Invalid rating' });

  try {
    let width = null, height = null;
    const thumbPath = path.join(UPLOADS_PATH, 'thumbs', 'thumb_' + req.file.filename);
    try {
      const meta = await sharp(req.file.path).metadata();
      width = meta.width; height = meta.height;
      await sharp(req.file.path).resize(300,300,{fit:'cover'}).toFile(thumbPath);
    } catch {}

    const md5 = crypto.createHash('md5').update(fs.readFileSync(req.file.path)).digest('hex');
    const dup = db.prepare('SELECT id FROM posts WHERE md5=?').get(md5);
    if (dup) { fs.unlinkSync(req.file.path); return res.status(409).json({ error:'Duplicate', existing_id: dup.id }); }

    const { lastInsertRowid: postId } = db.prepare(
      `INSERT INTO posts (filename,original_name,mime_type,file_size,width,height,md5,rating,source,description,uploader_ip) VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).run(req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, width, height, md5, rating, source, description, req.ip);

    const tagList = tags.trim().split(/[\s,]+/).filter(Boolean).map(t=>t.toLowerCase());
    if (tagList.length) applyTags(db, postId, tagList);

    const post = db.prepare(`${WITH_TAGS} WHERE p.id=? GROUP BY p.id`).get(postId);
    res.status(201).json(formatPost(post));
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/posts/:id
router.patch('/:id', (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT id FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error:'Not found' });
  const { rating, source, description, tags } = req.body;
  if (rating && ['s','q','e'].includes(rating)) db.prepare('UPDATE posts SET rating=?,updated_at=unixepoch() WHERE id=?').run(rating, post.id);
  if (source      !== undefined) db.prepare('UPDATE posts SET source=?,updated_at=unixepoch() WHERE id=?').run(source, post.id);
  if (description !== undefined) db.prepare('UPDATE posts SET description=?,updated_at=unixepoch() WHERE id=?').run(description, post.id);
  if (tags !== undefined) {
    db.prepare('DELETE FROM post_tags WHERE post_id=?').run(post.id);
    const list = tags.trim().split(/[\s,]+/).filter(Boolean).map(t=>t.toLowerCase());
    if (list.length) applyTags(db, post.id, list);
  }
  const updated = db.prepare(`${WITH_TAGS} WHERE p.id=? GROUP BY p.id`).get(post.id);
  res.json(formatPost(updated));
});

// DELETE /api/posts/:id
router.delete('/:id', (req, res) => {
  const db   = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error:'Not found' });
  const del = f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} };
  del(path.join(UPLOADS_PATH, post.filename));
  del(path.join(UPLOADS_PATH, 'thumbs', 'thumb_' + post.filename));
  db.prepare('DELETE FROM posts WHERE id=?').run(post.id);
  res.json({ deleted: true, id: post.id });
});

// POST /api/posts/:id/vote
router.post('/:id/vote', (req, res) => {
  const db  = getDb();
  const val = Number(req.body.value);
  if (![1,-1].includes(val)) return res.status(400).json({ error:'value must be 1 or -1' });
  const post = db.prepare('SELECT id,score FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error:'Not found' });
  const existing = db.prepare('SELECT value FROM votes WHERE post_id=? AND voter_ip=?').get(post.id, req.ip);
  if (existing) {
    if (existing.value === val) return res.status(409).json({ error:'Already voted' });
    db.prepare('UPDATE votes SET value=? WHERE post_id=? AND voter_ip=?').run(val, post.id, req.ip);
    db.prepare('UPDATE posts SET score=score+?,updated_at=unixepoch() WHERE id=?').run(val*2, post.id);
  } else {
    db.prepare('INSERT INTO votes (post_id,voter_ip,value) VALUES (?,?,?)').run(post.id, req.ip, val);
    db.prepare('UPDATE posts SET score=score+?,updated_at=unixepoch() WHERE id=?').run(val, post.id);
  }
  res.json({ score: db.prepare('SELECT score FROM posts WHERE id=?').get(post.id).score });
});

// POST /api/posts/:id/favorite
router.post('/:id/favorite', (req, res) => {
  const db   = getDb();
  const post = db.prepare('SELECT id FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error:'Not found' });
  const fav = db.prepare('SELECT 1 FROM favorites WHERE post_id=? AND user_ip=?').get(post.id, req.ip);
  if (fav) {
    db.prepare('DELETE FROM favorites WHERE post_id=? AND user_ip=?').run(post.id, req.ip);
    db.prepare('UPDATE posts SET fav_count=MAX(0,fav_count-1),updated_at=unixepoch() WHERE id=?').run(post.id);
    return res.json({ favorited: false });
  }
  db.prepare('INSERT INTO favorites (post_id,user_ip) VALUES (?,?)').run(post.id, req.ip);
  db.prepare('UPDATE posts SET fav_count=fav_count+1,updated_at=unixepoch() WHERE id=?').run(post.id);
  res.json({ favorited: true });
});

module.exports = router;
