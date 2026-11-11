import { useCallback, useEffect, useRef, useState } from 'react'
import HomePage from './HomePage.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import UploadPage from './UploadPage.jsx'
import { applyTheme, getTheme } from './theme.js'

function BrandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />
    </svg>
  )
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const initial = getTheme()
    applyTheme(initial)
    return initial
  })
  const [path, setPath] = useState(() => (window.location.pathname === '/upload' ? '/upload' : '/'))
  const [canSlice, setCanSlice] = useState(false)
  const sliceRef = useRef(() => {})

  const onCanSlice = useCallback((ready, slice) => {
    sliceRef.current = slice
    setCanSlice(ready)
  }, [])

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname === '/upload' ? '/upload' : '/')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function go(event, next) {
    event.preventDefault()
    if (window.location.pathname !== next) window.history.pushState({}, '', next)
    setPath(next)
    window.scrollTo(0, 0)
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  const onUpload = path === '/upload'

  return (
    <div className={onUpload ? 'view-upload' : 'view-home'}>
      <header className="top">
        <a className="brand" href="/" onClick={(event) => go(event, '/')}>
          <i><BrandIcon /></i>
          SimsLayer
        </a>
        <div className="top-right">
          {onUpload ? (
            <button className="btn small" type="button" disabled={!canSlice} onClick={() => sliceRef.current()}>
              ▷ Slice Model
            </button>
          ) : null}
          <ThemeToggle onToggle={toggleTheme} />
        </div>
      </header>

      {onUpload ? (
        <UploadPage theme={theme} onCanSlice={onCanSlice} />
      ) : (
        <HomePage theme={theme} onUpload={(event) => go(event, '/upload')} />
      )}
    </div>
  )
}
