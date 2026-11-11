import { useEffect, useRef } from 'react'

// Faint green mesh behind the home page. It morphs between six fixed layouts.
// The loop stops when this component unmounts (leaving the home route).

const NODE_COUNT = 64
const HOLD_MS = 3800
const MORPH_MS = 3200
const NEIGHBOURS = 3

function makeRng(seed) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

function makeShapes() {
  const random = makeRng(11)
  const ring = Array.from({ length: NODE_COUNT }, (_, i) => {
    const angle = (i / NODE_COUNT) * Math.PI * 2
    return [Math.cos(angle) * 0.8, Math.sin(angle) * 0.8]
  })
  const grid = Array.from({ length: NODE_COUNT }, (_, i) => [
    ((i % 8) / 7 * 2 - 1) * 0.9,
    (Math.floor(i / 8) / 7 * 2 - 1) * 0.8,
  ])
  const spiral = Array.from({ length: NODE_COUNT }, (_, i) => {
    const angle = i * 0.62
    const radius = (i / NODE_COUNT) * 0.95 + 0.05
    return [Math.cos(angle) * radius, Math.sin(angle) * radius]
  })
  const scatter = Array.from({ length: NODE_COUNT }, () => [
    (random() * 2 - 1) * 0.95,
    (random() * 2 - 1) * 0.85,
  ])
  const wave = Array.from({ length: NODE_COUNT }, (_, i) => {
    const x = (i / (NODE_COUNT - 1)) * 2 - 1
    return [x * 0.95, Math.sin(x * 5 + (i % 2) * 0.7) * 0.4 + (i % 2 ? 0.28 : -0.28)]
  })
  const rings = Array.from({ length: NODE_COUNT }, (_, i) => {
    const ringIndex = i < 24 ? 0 : i < 44 ? 1 : 2
    const counts = [24, 20, 20]
    const start = [0, 24, 44][ringIndex]
    const angle = ((i - start) / counts[ringIndex]) * Math.PI * 2 + ringIndex * 0.4
    const radius = [0.85, 0.55, 0.25][ringIndex]
    return [Math.cos(angle) * radius, Math.sin(angle) * radius]
  })
  return [ring, grid, spiral, scatter, wave, rings]
}

const SHAPES = makeShapes()
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2)

function meshColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--mesh').trim() || '22,190,90'
}

export default function MeshBackground({ theme }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let frame = 0
    let startedAt = 0

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      if (!width || !height) return
      canvas.width = width * ratio
      canvas.height = height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (reduce) draw(0)
    }

    function draw(time) {
      const cycle = HOLD_MS + MORPH_MS
      const elapsed = time - startedAt
      const index = Math.floor(elapsed / cycle)
      const local = elapsed - index * cycle
      const fromIndex = ((index % SHAPES.length) + SHAPES.length) % SHAPES.length
      const from = SHAPES[fromIndex]
      const to = SHAPES[(fromIndex + 1) % SHAPES.length]
      const progress = local < HOLD_MS ? 0 : ease((local - HOLD_MS) / MORPH_MS)
      const points = new Array(NODE_COUNT)
      for (let i = 0; i < NODE_COUNT; i += 1) {
        const x = from[i][0] + (to[i][0] - from[i][0]) * progress + Math.sin(time / 1700 + i) * 0.012
        const y = from[i][1] + (to[i][1] - from[i][1]) * progress + Math.cos(time / 1500 + i * 1.3) * 0.012
        points[i] = [width / 2 + x * width * 0.5, height / 2 + y * height * 0.5]
      }

      const rgb = meshColor()
      context.clearRect(0, 0, width, height)
      const maxDistance = Math.min(width, height) * 0.45
      context.lineWidth = 1
      for (let i = 0; i < NODE_COUNT; i += 1) {
        const nearest = []
        for (let j = 0; j < NODE_COUNT; j += 1) {
          if (j === i) continue
          const distance = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1])
          if (nearest.length < NEIGHBOURS || distance < nearest[nearest.length - 1][1]) {
            nearest.push([j, distance])
            nearest.sort((a, b) => a[1] - b[1])
            if (nearest.length > NEIGHBOURS) nearest.pop()
          }
        }
        for (const [j, distance] of nearest) {
          const alpha = Math.max(0.06, 0.55 * (1 - distance / maxDistance))
          context.strokeStyle = `rgba(${rgb},${alpha})`
          context.beginPath()
          context.moveTo(points[i][0], points[i][1])
          context.lineTo(points[j][0], points[j][1])
          context.stroke()
        }
      }

      context.shadowColor = `rgba(${rgb},.9)`
      context.shadowBlur = 10
      context.fillStyle = `rgba(${rgb},.9)`
      for (const [x, y] of points) {
        context.beginPath()
        context.arc(x, y, 2.2, 0, Math.PI * 2)
        context.fill()
      }
      context.shadowBlur = 0
    }

    function loop(time) {
      draw(time)
      frame = requestAnimationFrame(loop)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    if (!reduce) {
      startedAt = performance.now()
      frame = requestAnimationFrame(loop)
    }

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [theme])

  return <canvas ref={canvasRef} className="mesh" aria-hidden="true" />
}
