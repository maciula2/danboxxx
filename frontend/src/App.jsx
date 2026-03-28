import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { Sidebar } from './Sidebar'
import { PostsView } from './PostsView'
import { UploadPage } from './UploadPage'
import { TagsPage } from './TagsPage'

export default function App() {
  const [page, setPage]             = useState('home')
  const [activeTags, setActiveTags] = useState([])
  const [stats, setStats]           = useState({})
  const [popularTags, setPopTags]   = useState([])

  useEffect(() => {
    api('/health').then(setStats).catch(() => {})
    api('/tags?limit=12&order=count').then(setPopTags).catch(() => {})
  }, [])

  const addTags = useCallback(tags => {
    setActiveTags(prev => {
      const next = [...prev]
      tags.forEach(t => { if (!next.includes(t)) next.push(t) })
      return next
    })
  }, [])

  const removeTag = useCallback(t => setActiveTags(prev => prev.filter(x => x !== t)), [])
  const navTo     = useCallback(p => setPage(p), [])

  return (
    <>
      <div className="topbar">
        <div className="topbar-nav">
          {[['home','Home'],['posts','Posts'],['upload','Upload'],['tags','Tags']].map(([p, l]) => (
            <a key={p} onClick={() => navTo(p)} style={page === p ? { color:'#ffcc66' } : {}}>{l}</a>
          ))}
        </div>
        <div className="topbar-right">
          {stats.posts != null ? `${stats.posts} posts | ${stats.tags} tags` : 'Connecting...'}
        </div>
      </div>

      <div className="layout">
        <Sidebar
          stats={stats}
          popularTags={popularTags}
          onNav={navTo}
          onTagClick={name => { addTags([name]); navTo('posts') }}
          currentPage={page}
        />
        <div className="main">
          {(page === 'home' || page === 'posts') && (
            <PostsView
              key={page}
              activeTags={activeTags}
              onRemoveTag={removeTag}
              showHero={page === 'home'}
              onSearch={addTags}
              onTagClick={name => { addTags([name]); navTo('posts') }}
              onNav={navTo}
              stats={stats}
            />
          )}
          {page === 'upload' && (
            <UploadPage onUploaded={() => { navTo('posts'); api('/health').then(setStats) }} />
          )}
          {page === 'tags' && (
            <TagsPage onTagClick={name => { addTags([name]); navTo('posts') }} />
          )}
          <div className="footer">
            RuleRaduszyn &copy; 2026 &bull;{' '}
            <a onClick={() => navTo('upload')}>Upload</a> &bull;{' '}
            <a onClick={() => navTo('tags')}>Tags</a> &bull; All characters are fictional.
          </div>
        </div>
      </div>
    </>
  )
}
