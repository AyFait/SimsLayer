/*
  STL preview. react-three-fiber draws the scene; OrbitControls rotates and zooms it.
  The file is parsed here (binary or ASCII). STEP files are accepted but not drawn.
  Z is up, matching a printer bed: the grid lies on XY and the part sits on it.
*/
import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function parseStl(buffer) {
  const view = new DataView(buffer)
  const count = buffer.byteLength >= 84 ? view.getUint32(80, true) : 0
  let positions

  // Binary STL is a fixed-size record. ASCII STL is the text "vertex x y z" form.
  if (count > 0 && 84 + count * 50 === buffer.byteLength) {
    positions = new Float32Array(count * 9)
    for (let i = 0; i < count; i += 1) {
      const offset = 84 + i * 50 + 12
      for (let vertex = 0; vertex < 3; vertex += 1) {
        for (let axis = 0; axis < 3; axis += 1) {
          positions[i * 9 + vertex * 3 + axis] = view.getFloat32(offset + vertex * 12 + axis * 4, true)
        }
      }
    }
  } else {
    const text = new TextDecoder().decode(buffer)
    const values = []
    for (const match of text.matchAll(/vertex\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)\s+([-+0-9.eE]+)/g)) {
      values.push(Number(match[1]), Number(match[2]), Number(match[3]))
    }
    positions = new Float32Array(values)
  }

  // One triangle is three vertices, nine numbers. Anything else cannot be drawn.
  if (positions.length < 9 || positions.length % 9 !== 0) throw new Error('No triangles in this STL.')

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const center = new THREE.Vector3()
  const span = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(span)
  geometry.translate(-center.x, -center.y, -box.min.z)
  return {
    geometry,
    size: Math.max(span.x, span.y, span.z) || 1,
    height: span.z,
  }
}

function Scene({ model, theme, viewRef }) {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls)
  const dark = theme === 'dark'
  const fit = model || { size: 100, height: 0 }

  useEffect(() => {
    camera.up.set(0, 0, 1)
    camera.near = Math.max(fit.size / 1000, 0.001)
    camera.far = Math.max(fit.size * 100, 1000)
    camera.position.set(fit.size * 1.4, -fit.size * 1.4, fit.size * 1.1)
    camera.updateProjectionMatrix()
    if (controls) {
      controls.target.set(0, 0, fit.height / 2)
      controls.update()
    }
  }, [camera, controls, fit.size, fit.height])

  useEffect(() => {
    viewRef.current = {
      zoom(factor) {
        if (!controls) return
        const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor)
        camera.position.copy(controls.target).add(offset)
        controls.update()
      },
      reset() {
        camera.up.set(0, 0, 1)
        camera.position.set(fit.size * 1.4, -fit.size * 1.4, fit.size * 1.1)
        camera.updateProjectionMatrix()
        if (controls) {
          controls.target.set(0, 0, fit.height / 2)
          controls.update()
        }
      },
    }
  })

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[1, -1, 2]} intensity={0.8} />
      <directionalLight position={[-1, 1, 0.5]} intensity={0.35} />
      {model ? (
        <gridHelper
          args={[model.size * 2.4, 24, dark ? '#3a4a5c' : '#9aa3b2', dark ? '#25303d' : '#c9cdd6']}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ) : null}
      {model ? (
        <mesh geometry={model.geometry}>
          <meshStandardMaterial color={dark ? '#9fb4c8' : '#3b4a63'} flatShading roughness={0.6} metalness={0.1} />
        </mesh>
      ) : null}
      <OrbitControls makeDefault enableDamping />
    </>
  )
}

export default function Preview3D({ file, kind, theme }) {
  const viewRef = useRef({})
  const [model, setModel] = useState(null)
  const [note, setNote] = useState('Upload a file to preview')
  const [showNote, setShowNote] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!file || !kind) {
        setModel(null)
        setNote('Upload a file to preview')
        setShowNote(true)
        return
      }
      if (!/STL/.test(kind)) {
        setModel(null)
        setNote("STEP file accepted. Browser preview for STEP isn't available yet; it will be shown after processing.")
        setShowNote(true)
        return
      }
      try {
        const parsed = parseStl(await file.arrayBuffer())
        if (cancelled) {
          parsed.geometry.dispose()
          return
        }
        setModel(parsed)
        setShowNote(false)
      } catch {
        if (!cancelled) {
          setModel(null)
          setNote("Couldn't render a preview for this file.")
          setShowNote(true)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [file, kind])

  useEffect(() => () => model?.geometry.dispose(), [model])

  return (
    <div className="viewport">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        camera={{ fov: 40, near: 0.1, far: 10000, up: [0, 0, 1], position: [120, -120, 100] }}
        onCreated={({ camera }) => camera.up.set(0, 0, 1)}
      >
        <Scene model={model} theme={theme} viewRef={viewRef} />
      </Canvas>
      <div className="vp-hint">Drag to rotate</div>
      {showNote ? <div className="vp-note">{note}</div> : null}
      <div className="vp-tools">
        <button type="button" aria-label="Zoom in" onClick={() => viewRef.current.zoom?.(0.8)}>+</button>
        <button type="button" aria-label="Zoom out" onClick={() => viewRef.current.zoom?.(1.25)}>−</button>
        <button type="button" aria-label="Reset view" onClick={() => viewRef.current.reset?.()}>⟲</button>
      </div>
    </div>
  )
}
