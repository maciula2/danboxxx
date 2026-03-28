export const ActiveTags = ({ tags, onRemove }) => (
  <div className="active-tags">
    {tags.map(t => (
      <span key={t} className="atag">
        {t}<span className="atag-rm" onClick={() => onRemove(t)}>✕</span>
      </span>
    ))}
  </div>
)
