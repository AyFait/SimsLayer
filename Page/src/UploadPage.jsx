import { useEffect, useRef, useState } from 'react'
import Preview3D from './Preview3D.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import { validateCad } from './validateCad.js'

export default function UploadPage({ theme, onCanSlice }) {
  const inputRef = useRef(null)
  const settingsRef = useRef(null)
  const sliceRef = useRef(() => {})
  const [over, setOver] = useState(false)
  const [message, setMessage] = useState(null)
  const [cad, setCad] = useState(null)
  const [status, setStatus] = useState('')

  sliceRef.current = () => {
    if (!cad || !settingsRef.current) return
    const payload = { file: cad.file.name, ...settingsRef.current.getSettings() }
    window.dispatchEvent(new CustomEvent('simslayer:slice', { detail: payload }))
    console.log('SimsLayer slice request', payload)
    setStatus("Slice request prepared. The slicing engine isn't connected to this page yet.")
  }

  useEffect(() => {
    onCanSlice(Boolean(cad), () => sliceRef.current())
    return () => onCanSlice(false, () => {})
  }, [cad, onCanSlice])

  async function handleFile(file) {
    if (!file) return
    const result = await validateCad(file)
    if (!result.ok) {
      setCad(null)
      setMessage({ ok: false, text: result.reason })
      return
    }
    const megabytes = (file.size / 1048576).toFixed(1)
    setCad({ file, kind: result.kind, detail: result.detail })
    setMessage({ ok: true, text: `${file.name} (${megabytes} MB) — ${result.kind}, ${result.detail}` })
    setStatus('')
  }

  return (
    <div className="page">
      <div className="step">Step 1: Upload file</div>
      <input
        ref={inputRef}
        type="file"
        accept=".stl,.step,.stp"
        hidden
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <button
        className={over ? 'drop over' : 'drop'}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setOver(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          handleFile(event.dataTransfer.files?.[0])
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
        </svg>
        <b>Upload file</b>
        <small>Drag & drop a file here</small>
        <small>Supports: .stl, .step (max 100MB)</small>
      </button>
      {message ? <p className={message.ok ? 'ok' : 'err'}>{message.text}</p> : null}

      <div className="step">3D Preview</div>
      <Preview3D file={cad?.file || null} kind={cad?.kind || ''} theme={theme} />

      <div className="step">Step 2: Configure settings</div>
      <SettingsPanel ref={settingsRef} />
      <p className="status">{status}</p>
    </div>
  )
}
