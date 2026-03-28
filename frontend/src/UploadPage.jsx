import { useState, useRef } from 'react'

export const UploadPage = ({ onUploaded }) => {
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState('')
  const [tags, setTags]       = useState('')
  const [rating, setRating]   = useState('s')
  const [source, setSource]   = useState('')
  const [desc, setDesc]       = useState('')
  const [msg, setMsg]         = useState(null)
  const [over, setOver]       = useState(false)
  const fileRef = useRef()

  const pickFile = f => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async () => {
    if (!file) { setMsg({ ok:false, text:'Please select a file.' }); return }
    const fd = new FormData()
    fd.append('file', file)
    fd.append('rating', rating)
    fd.append('tags', tags)
    fd.append('source', source)
    fd.append('description', desc)
    setMsg({ ok:true, text:'Uploading...' })
    try {
      const r    = await fetch('/api/posts', { method:'POST', body: fd })
      const data = await r.json()
      if (!r.ok) throw data
      setMsg({ ok:true, text:`Post #${data.id} uploaded!` })
      setFile(null); setPreview(''); setTags(''); setSource(''); setDesc('')
      onUploaded()
    } catch (e) {
      setMsg({ ok:false, text:'Upload failed: '+(e.error||e.message||'Unknown error') })
    }
  }

  return (
    <div className="upload-wrap">
      <h2>↑ Upload New Post</h2>
      <div
        className={`drop-zone${over ? ' over' : ''}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files[0]) }}
      >
        {file ? `Selected: ${file.name}` : 'Click or drag & drop image here (JPG PNG GIF WebP — max 50MB)'}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => pickFile(e.target.files[0])} />
      {preview && <img src={preview} alt="preview" style={{ maxWidth:200, maxHeight:200, margin:'8px 0', border:'1px solid #3a3a5a' }} />}

      <div className="form-row">
        <label>Tags (space-separated)</label>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="1girl long_hair original artist:myname" />
      </div>
      <div className="form-row">
        <label>Rating</label>
        <select value={rating} onChange={e => setRating(e.target.value)}>
          <option value="s">Safe</option>
          <option value="q">Questionable</option>
          <option value="e">Explicit</option>
        </select>
      </div>
      <div className="form-row">
        <label>Source URL</label>
        <input value={source} onChange={e => setSource(e.target.value)} placeholder="https://..." />
      </div>
      <div className="form-row">
        <label>Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional..." />
      </div>
      <button className="submit-btn" onClick={submit}>↑ Upload</button>
      {msg && <div className={msg.ok ? 'upload-ok' : 'upload-err'}>{msg.text}</div>}
    </div>
  )
}
