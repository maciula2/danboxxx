# DanboXXX (React Edition)

Full-stack imageboard. 

## Quick Start

```bash
unzip danboxxx-react.zip
cd danboxxx-react
docker compose up --build -d
```

Open **http://localhost:8080**

## Development 
Run development server:
```
# terminal 1 — backend
cd danboxxx/backend
npm install
node server.js

# terminal 1 — frontend
cd danboxxx/frontend
npm install
npm run dev
```

Components: `App` → `Sidebar`, `PostsView`, `UploadPage`, `TagsPage`  
`PostsView` → `PostGrid`, `PostModal`, `SearchBar`, `ActiveTags`, `PageNav`  
`PostModal` → `Comments`, `TagBadge`

## API Endpoints

```
GET    /api/posts              list (tags, rating, order, page, limit)
GET    /api/posts/:id          single post
POST   /api/posts              upload (multipart)
PATCH  /api/posts/:id          edit tags/rating/source
DELETE /api/posts/:id          delete
POST   /api/posts/:id/vote     { value: 1 | -1 }
POST   /api/posts/:id/favorite toggle

GET    /api/tags               list/search
GET    /api/tags/autocomplete  ?q=
PATCH  /api/tags/:name         update category

GET    /api/comments           ?post_id=
POST   /api/comments           { post_id, body, author_name? }
DELETE /api/comments/:id

GET    /api/health             stats
```

## Data

Persisted via Docker volumes:
- `db_data` → SQLite database
- `uploads` → images + thumbnails

Reset everything: `docker compose down -v`

