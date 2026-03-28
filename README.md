# DanboXXXXX (React Edition)

Full-stack imageboard — Node.js/Express/SQLite backend + React frontend (CDN, no build step).

## Quick Start

```bash
unzip danboxxxxx-react.zip
cd danboxxxxx-react
docker compose up --build -d
```

Open **http://localhost:8080**

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express + SQLite (better-sqlite3) |
| File processing | sharp (thumbnails, dimensions) |
| Frontend | React 18 via CDN + Babel Standalone (no build step) |
| Web server | Nginx (serves frontend, proxies /api → backend) |
| Container | Docker Compose |

## React Architecture

All UI lives in `frontend/public/index.html` as a single-file React app using:

- **Hooks only** — useState, useEffect, useCallback, useMemo, useRef
- **No router** — simple `page` state string drives which component renders
- **No Redux** — state lives in `App` and flows down via props
- **Babel Standalone** — transpiles JSX in-browser, no build needed

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
