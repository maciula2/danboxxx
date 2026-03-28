import { useState, useEffect } from 'react'
import { useDebounce } from './useDebounce'
import { api } from './api'
import { TAG_COLORS } from './utils'

export const TagsPage = ({ onTagClick }) => {
  const [q, setQ]       = useState('')
  const [cat, setCat]   = useState('')
  const [tags, setTags] = useState([])
  const dq = useDebounce(q, 200)

  useEffect(() => {
    const params = new URLSearchParams({ limit: 100 })
    if (dq)  params.set('q', dq)
    if (cat) params.set('category', cat)
    api('/tags?' + params).then(setTags).catch(() => {})
  }, [dq, cat])

  return (
    <div>
      <div style={{ display:'flex', gap:4, alignItems:'center', marginBottom:10 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tags..."
          style={{ flex:1, background:'#0d0d1e', border:'1px solid #5533aa', color:'#e8e8ff', padding:'5px 8px', outline:'none' }} />
        <select value={cat} onChange={e => setCat(e.target.value)}
          style={{ background:'#111122', border:'1px solid #3a3a5a', color:'#c8c8d8', padding:'2px 4px' }}>
          <option value="">All categories</option>
          {['general','artist','copyright','character','meta'].map(c =>
            <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
          )}
        </select>
      </div>
      <table className="tags-table">
        <thead><tr><th>Tag</th><th>Category</th><th style={{ textAlign:'right' }}>Posts</th></tr></thead>
        <tbody>
          {tags.map(t => (
            <tr key={t.id}>
              <td><a style={{ color: TAG_COLORS[t.category]||'#88aadd', cursor:'pointer' }} onClick={() => onTagClick(t.name)}>{t.name}</a></td>
              <td style={{ color:'#555577' }}>{t.category}</td>
              <td style={{ textAlign:'right', color:'#7799cc' }}>{t.post_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
