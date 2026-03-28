const express = require('express');
const { getDb } = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { q, category, order, limit=50 } = req.query;
  const where = []; const params = [];
  if (q)        { where.push('name LIKE ?'); params.push(q.replace(/\*/g,'%') + '%'); }
  if (category && ['general','artist','copyright','character','meta'].includes(category))
                { where.push('category = ?'); params.push(category); }
  const W = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const O = order === 'name' ? 'name ASC' : 'post_count DESC';
  res.json(db.prepare(`SELECT * FROM tags ${W} ORDER BY ${O} LIMIT ?`).all(...params, Math.min(500, parseInt(limit))));
});

router.get('/autocomplete', (req, res) => {
  const db = getDb();
  const q  = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.json([]);
  res.json(db.prepare(`SELECT name,category,post_count FROM tags WHERE name LIKE ? ORDER BY post_count DESC LIMIT 12`).all(q + '%'));
});

router.get('/:name', (req, res) => {
  const tag = getDb().prepare('SELECT * FROM tags WHERE name=?').get(req.params.name);
  if (!tag) return res.status(404).json({ error:'Not found' });
  res.json(tag);
});

router.patch('/:name', (req, res) => {
  const { category } = req.body;
  if (!['general','artist','copyright','character','meta'].includes(category))
    return res.status(400).json({ error:'Invalid category' });
  const info = getDb().prepare('UPDATE tags SET category=? WHERE name=?').run(category, req.params.name);
  if (!info.changes) return res.status(404).json({ error:'Not found' });
  res.json({ updated: true });
});

module.exports = router;
