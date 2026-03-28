import { isNew, placeholder } from './utils'

export const PostGrid = ({ posts, loading, onOpen }) => {
  if (loading) return <div className="empty">Loading posts...</div>
  if (!posts.length) return <div className="empty">No posts found.</div>
  return (
    <div className="grid">
      {posts.map((p, idx) => {
        const allTags = [...(p.tags.artist||[]), ...(p.tags.character||[]), ...(p.tags.general||[])].slice(0,6).join(' ')
        return (
          <div key={p.id} className={`thumb${isNew(p.created_at) ? ' thumb-new' : ''}`} onClick={() => onOpen(idx)}>
            <div className="thumb-img">
              {p.file_url
                ? <img src={p.thumb_url||p.file_url} alt="" loading="lazy"
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
                : null}
              <span className="thumb-placeholder" style={{ display: p.file_url ? 'none' : 'flex' }}>{placeholder(p.id)}</span>
            </div>
            <div className="thumb-overlay">{allTags}</div>
            <div className="thumb-meta">
              <span>#{p.id}</span>
              <span><span className={`r-${p.rating}`}>{p.rating}</span> <span className="score">+{p.score}</span></span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
