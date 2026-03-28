export const PageNav = ({ page, pages, onChange }) => {
  if (pages <= 1) return null
  const btns = []
  if (page > 1) btns.push({ l: '◀', v: page - 1 })
  for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) btns.push({ l: i, v: i })
  if (page < pages) btns.push({ l: '▶', v: page + 1 })
  return (
    <div style={{ display:'flex', gap:3 }}>
      {btns.map((b, i) => (
        <button key={i} className={`page-btn${b.v === page ? ' active' : ''}`} onClick={() => onChange(b.v)}>{b.l}</button>
      ))}
    </div>
  )
}
