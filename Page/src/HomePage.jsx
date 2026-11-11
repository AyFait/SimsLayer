import MeshBackground from './MeshBackground.jsx'
import Reel from './Reel.jsx'

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
    </svg>
  )
}

export default function HomePage({ theme, onUpload }) {
  return (
    <section className="home">
      <MeshBackground theme={theme} />
      <main className="home-inner">
        <Reel />
        <h1 className="hero">SimsLayer</h1>
        <p className="tagline">Optimize your part for 3D printing</p>
        <a className="btn" href="/upload" onClick={onUpload}>
          <UploadIcon />
          Upload a part
        </a>
      </main>
    </section>
  )
}
