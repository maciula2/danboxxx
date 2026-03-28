import { useState, useEffect } from 'react'
import { api } from './api'
import { fmtDate } from './utils'

export const Comments = ({ postId }) => {
  const [comments, setComments] = useState([])
  const [author, setAuthor]     = useState('')
  const [body, setBody]         = useState('')

  useEffect(() => {
    api('/comments?post_id=' + postId).then(setComments).catch(() => {})
  }, [postId])

  const submit = async () => {
    if (!body.trim()) return
    try {
      await api('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, author_name: author || 'Anonymous', body })
      })
      setBody('')
      api('/comments?post_id=' + postId).then(setComments)
    } catch {}
  }

  return (
    <div className="comments-section">
      <div className="msec-title" style={{ marginBottom: 8 }}>Comments</div>
      {comments.length === 0
        ? <div style={{ color:'#555577', fontSize:10 }}>No comments yet.</div>
        : comments.map(c => (
            <div key={c.id} className="comment">
              <div className="comment-hdr">
                <span className="comment-author">{c.author_name}</span>
                <span className="comment-date">{fmtDate(c.created_at)}</span>
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))
      }
      <div className="cform">
        <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Name (default: Anonymous)" maxLength={50} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Add a comment..." maxLength={2000} />
        <button onClick={submit}>Post Comment</button>
      </div>
    </div>
  )
}
