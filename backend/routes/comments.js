const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const postId = parseInt(req.query.post_id);
  if (!postId) return res.status(400).json({ error:'post_id required' });
  res.json(getDb().prepare(`SELECT id,post_id,author_name,body,created_at FROM comments WHERE post_id=? ORDER BY created_at ASC`).all(postId));
});

router.post('/', (req, res) => {
  const db = getDb();
  const { post_id, author_name='Anonymous', body } = req.body;
  if (!post_id || !body?.trim()) return res.status(400).json({ error:'post_id and body required' });
  if (body.length > 2000) return res.status(400).json({ error:'Too long' });
  if (!db.prepare('SELECT id FROM posts WHERE id=?').get(post_id)) return res.status(404).json({ error:'Post not found' });
  const { lastInsertRowid } = db.prepare(
    `INSERT INTO comments (post_id,author_ip,author_name,body) VALUES (?,?,?,?)`
  ).run(post_id, req.ip, author_name.slice(0,50), body.trim());
  res.status(201).json(db.prepare('SELECT id,post_id,author_name,body,created_at FROM comments WHERE id=?').get(lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM comments WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error:'Not found' });
  res.json({ deleted: true });
});

module.exports = router;
