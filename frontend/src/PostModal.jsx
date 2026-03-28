import { useState, useEffect } from 'react'
import { api } from './api'
import { fmtBytes, fmtDate, placeholder } from './utils'
import { TagBadge } from './TagBadge'
import { Comments } from './Comments'

export const PostModal = ({ post, posts, idx, onClose, onNav, onTagClick }) => {
  const [score, setScore] = useState(post.score)
  const [favs, setFavs]   = useState(post.fav_count)
  const [faved, setFaved] = useState(false)

  useEffect(() => {
    setScore(post.score); setFavs(post.fav_count); setFaved(false)
  }, [post.id])

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft'  && idx > 0)              onNav(-1)
      if (e.key === 'ArrowRight' && idx < posts.length-1) onNav(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [idx, posts.length])

  const vote = async val => {
    try {
      const r = await api('/posts/'+post.id+'/vote', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ value: val }) })
      setScore(r.score)
    } catch {}
  }

  const toggleFav = async () => {
    try {
      const r = await api('/posts/'+post.id+'/favorite', { method:'POST' })
      setFaved(r.favorited)
      setFavs(f => f + (r.favorited ? 1 : -1))
    } catch {}
  }

  const rFull = { s:'Safe', q:'Questionable', e:'Explicit' }[post.rating]

  return (
    <div className="modal-bg" onClick={e => e.target.className === 'modal-bg' && onClose()}>
      <div className="modal-box">
        <div className="modal-topbar">
          <span>Post #{post.id}</span>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <a onClick={() => idx > 0 && onNav(-1)} style={{ fontSize:10 }}>◀ Prev</a>
            <a onClick={() => idx < posts.length-1 && onNav(1)} style={{ fontSize:10 }}>Next ▶</a>
            <button className="modal-close-btn" onClick={onClose}>✕ Close</button>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-img">
            {post.file_url
              ? <img src={post.file_url} alt={`Post ${post.id}`} />
              : <span style={{ fontSize:96 }}>{placeholder(post.id)}</span>}
          </div>
          <div className="modal-side">
            <div className="msec">
              <div className="msec-title">Actions</div>
              <div className="act-btns">
                <button className="act-btn fav" onClick={toggleFav}>{faved ? '★ Unfav' : '☆ Favorite'} ({favs})</button>
                <button className="act-btn" onClick={() => vote(1)}>▲ Up</button>
                <button className="act-btn" onClick={() => vote(-1)}>▼ Down</button>
                {post.file_url && <a href={post.file_url} download className="act-btn" style={{ display:'inline-block' }}>↓ DL</a>}
              </div>
            </div>

            <div className="msec">
              <div className="msec-title">Info</div>
              {[
                ['ID',        `#${post.id}`],
                ['Rating',    <span className={`r-${post.rating}`}>{rFull}</span>],
                ['Score',     <span className="score">{score >= 0 ? '+' : ''}{score}</span>],
                ['Favorites', favs],
                ...(post.width ? [['Size', `${post.width}×${post.height}`]] : []),
                ['File',      fmtBytes(post.file_size)],
                ['Uploaded',  fmtDate(post.created_at)],
                ...(post.source ? [['Source', <a href={post.source} target="_blank" rel="noopener">link</a>]] : []),
              ].map(([l, v]) => (
                <div key={l} className="info-row">
                  <span className="info-lbl">{l}</span>
                  <span className="info-val">{v}</span>
                </div>
              ))}
            </div>

            {['artist','copyright','character','general','meta'].map(cat => {
              const tags = post.tags[cat] || []
              if (!tags.length) return null
              return (
                <div key={cat} className="msec">
                  <div className="msec-title">{cat.charAt(0).toUpperCase()+cat.slice(1)}</div>
                  <div className="mtags">
                    {tags.map(t => (
                      <TagBadge key={t} name={t} category={cat} onClick={name => { onTagClick(name); onClose() }} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <Comments postId={post.id} />
      </div>
    </div>
  )
}
