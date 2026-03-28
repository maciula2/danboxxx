export const api = async (path, opts = {}) => {
  const r = await fetch('/api' + path, opts)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw data
  return data
}
