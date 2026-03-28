import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { SearchBar } from './SearchBar'
import { ActiveTags } from './ActiveTags'
import { PostGrid } from './PostGrid'
import { PostModal } from './PostModal'
import { PageNav } from './PageNav'

export const PostsView = ({ activeTags, onRemoveTag, showHero, onSearch, onTagClick, onNav, stats }) => {
  const [posts, setPosts]   = useState([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(0)
  const [page, setPage]     = useState(1)
  const [order, setOrder]   = useState('date')
  const [rating, setRating] = useState('')
  const [loading, setLoad]  = useState(false)
  const [modal, setModal]   = useState(null)

  const load = useCallback(async (p = page, o = order, r = rating, tags = activeTags) => {
    setLoad(true)
    try {
      const params = new URLSearchParams({ page:p, limit:20, order:o })
      if (r) params.set('rating', r)
      if (tags.length) params.set('tags', tags.join(' '))
      const data = await api('/posts?' + params)
      setPosts(data.posts); setTotal(data.total); setPages(data.pages)
    } catch {}
    setLoad(false)
  }, [])

  useEffect(() => { setPage(1); load(1, order, rating, activeTags) }, [activeTags, order, rating])

  const changePage = p => { setPage(p); load(p, order, rating, activeTags) }

  return (
    <>
      {showHero && (
        <div className="hero">
          <span className="logo">RULE<span>RADUSZYN</span></span>
          <div className="tagline">Jeśli coś jest w internecie - istnieje tego przeróbka z wawrzynem.</div>
          <div className="hero-stats">
            <span>{stats.posts?.toLocaleString()||'—'}</span> posts &bull;
            <span>{stats.tags?.toLocaleString()||'—'}</span> tags
          </div>
          <SearchBar onSearch={tags => { onSearch(tags); onNav('posts') }} />
          <div className="search-hints">
            <a onClick={() => onSearch(['rating:s'])}>safe</a> &nbsp;
            <a onClick={() => onSearch(['rating:q'])}>questionable</a> &nbsp;
            <a onClick={() => onSearch(['rating:e'])}>explicit</a> &nbsp;—&nbsp;
            <a onClick={() => setOrder('score')}>top rated</a> &nbsp;
            <a onClick={() => setOrder('random')}>random</a>
          </div>
          <ActiveTags tags={activeTags} onRemove={onRemoveTag} />
        </div>
      )}

      {!showHero && (
        <>
          <SearchBar onSearch={onSearch} />
          <ActiveTags tags={activeTags} onRemove={onRemoveTag} />
        </>
      )}

      {showHero && (
        <div className="notice">
          &#9432; Upload images and tag them. Use <code>tag1 tag2</code> to search. Prefix <code>-</code> to exclude: <code>-rating:e</code>
        </div>
      )}

      <div className="filter-bar">
        <label>Sort:</label>
        <select value={order} onChange={e => setOrder(e.target.value)}>
          <option value="date">Newest</option>
          <option value="score">Top Rated</option>
          <option value="random">Random</option>
        </select>
        <label>Rating:</label>
        <select value={rating} onChange={e => setRating(e.target.value)}>
          <option value="">All</option>
          <option value="s">Safe</option>
          <option value="q">Questionable</option>
          <option value="e">Explicit</option>
        </select>
        <span className="result-count">{total} posts</span>
        <PageNav page={page} pages={pages} onChange={changePage} />
      </div>

      <PostGrid posts={posts} loading={loading} onOpen={idx => setModal({ idx })} />

      {modal && posts[modal.idx] && (
        <PostModal
          post={posts[modal.idx]}
          posts={posts}
          idx={modal.idx}
          onClose={() => setModal(null)}
          onNav={dir => setModal(m => ({ idx: m.idx + dir }))}
          onTagClick={name => { onSearch([name]); onNav('posts') }}
        />
      )}
    </>
  )
}
