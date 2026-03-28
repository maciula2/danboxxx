import { useState, useEffect, useRef } from 'react'
import { useDebounce } from './useDebounce'
import { api } from './api'

export const SearchBar = ({ onSearch }) => {
  const [val, setVal] = useState('')
  const [ac, setAc]   = useState([])
  const dv  = useDebounce(val, 180)
  const ref = useRef()

  useEffect(() => {
    const words = dv.split(/\s+/)
    const last  = words[words.length - 1]
    if (!last || last.startsWith('-')) { setAc([]); return }
    api('/tags/autocomplete?q=' + encodeURIComponent(last)).then(setAc).catch(() => setAc([]))
  }, [dv])

  const submit = () => {
    const tags = val.trim().split(/\s+/).filter(Boolean)
    if (tags.length) { onSearch(tags); setVal(''); setAc([]) }
  }

  const selectAc = name => {
    const words = val.split(/\s+/)
    words[words.length - 1] = name
    setVal(words.join(' ') + ' ')
    setAc([])
    ref.current?.focus()
  }

  return (
    <div className="search-wrap">
      <input ref={ref} className="search-input" value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="Enter tags to search (space-separated)..." />
      <button className="search-btn" onClick={submit}>Search</button>
      {ac.length > 0 && (
        <div className="autocomplete">
          {ac.map(t => (
            <div key={t.name} className={`ac-item ${t.category}`} onClick={() => selectAc(t.name)}>
              {t.name}<span className="ac-count">{t.post_count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
