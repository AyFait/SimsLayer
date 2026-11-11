import { PARTS } from './parts.js'

// The track is drawn twice so translating it by half its width loops without a gap.
function cards() {
  return [...PARTS, ...PARTS]
}

function PartCard({ part }) {
  const before = `${`<g transform="rotate(-6 50 50) skewX(5)">${part.svg}</g>`}${part.hot
    .map(([x, y]) => `<circle class="hot" cx="${x}" cy="${y}" r="9"/>`)
    .join('')}`

  return (
    <article className="card">
      <div className="pair">
        <svg className="before" viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: before }} />
        <span className="arrow" aria-hidden="true">→</span>
        <svg className="after" viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: part.svg }} />
      </div>
      <div className="cap">
        <span>{part.name}</span>
        <span className="tag">Optimized</span>
      </div>
    </article>
  )
}

export default function Reel() {
  return (
    <div className="reel">
      <div className="track">
        {cards().map((part, index) => (
          <PartCard key={`${part.name}-${index}`} part={part} />
        ))}
      </div>
    </div>
  )
}
