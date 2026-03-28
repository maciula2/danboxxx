export const fmtBytes = b => !b ? '?' : b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB'
export const fmtDate  = ts => new Date(ts*1000).toLocaleDateString()
export const isNew    = ts => (Date.now()/1000 - ts) < 86400*2

export const TAG_COLORS = { artist:'#ffaa88', character:'#aaffaa', copyright:'#ffaaff', meta:'#aaaacc', general:'#88aadd' }
export const PLACEHOLDERS = ['🐉','🦊','🐺','🦋','🌙','⭐','🔮','🦅','🌸','🦄','🐯','🌊','🔥','⚡','🌺']
export const placeholder = id => PLACEHOLDERS[id % PLACEHOLDERS.length]
