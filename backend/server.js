const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { getDb } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads');

fs.mkdirSync(path.join(UPLOADS_PATH, 'thumbs'), { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_PATH));

getDb(); // init schema

app.use('/api/posts',    require('./routes/posts'));
app.use('/api/tags',     require('./routes/tags'));
app.use('/api/comments', require('./routes/comments'));

app.get('/api/health', (_req, res) => {
  const db = getDb();
  res.json({
    status: 'ok',
    posts: db.prepare('SELECT COUNT(*) as c FROM posts').get().c,
    tags:  db.prepare('SELECT COUNT(*) as c FROM tags').get().c,
    comments: db.prepare('SELECT COUNT(*) as c FROM comments').get().c,
  });
});

app.listen(PORT, () => console.log(`DanboXXXXX API on :${PORT}`));
