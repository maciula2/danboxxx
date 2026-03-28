export const Sidebar = ({ stats, popularTags, onNav, onTagClick, currentPage }) => (
  <div className="sidebar">
    <div className="sidebar-title">Navigation</div>
    {[['home','Home'],['posts','All Posts'],['upload','Upload'],['tags','Tags']].map(([p, l]) => (
      <a key={p} className={`sidebar-link${currentPage === p ? ' active' : ''}`} onClick={() => onNav(p)}>▶ {l}</a>
    ))}
    <div className="sidebar-title" style={{ marginTop:4 }}>Popular Tags</div>
    <div style={{ padding:'4px 0' }}>
      {popularTags.map(t => (
        <div key={t.id} className={`tag-row ${t.category}`}>
          <a onClick={() => onTagClick(t.name)}>{t.name}</a>
          <span className="tag-count">{t.post_count}</span>
        </div>
      ))}
    </div>
    <div className="sidebar-title" style={{ marginTop:4 }}>Stats</div>
    <div style={{ padding:'4px 8px', fontSize:10, color:'#555577', lineHeight:1.8 }}>
      Posts: <span style={{ color:'#8899cc' }}>{stats.posts?.toLocaleString()||'—'}</span><br/>
      Tags: <span style={{ color:'#8899cc' }}>{stats.tags?.toLocaleString()||'—'}</span><br/>
      Comments: <span style={{ color:'#8899cc' }}>{stats.comments?.toLocaleString()||'—'}</span>
    </div>
  </div>
)
