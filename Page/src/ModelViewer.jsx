/*
  This file draws an STL model in the browser.

  Three.js is the 3D library. It knows about meshes, lights, and cameras.
  react-three-fiber lets us describe that 3D scene with React components
  instead of calling Three.js by hand on every frame.
  OrbitControls is the mouse behavior: drag to rotate, scroll to zoom.

  The file never leaves the browser. We only read the bytes the user picked.
*/
import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'

// How the "print orientation" setting turns the model in the viewer.
// Three.js points Y up. These turns are visual only: they do not slice the part.
const ORIENTATION = {
  flat: [0, 0, 0],
  edge: [0, 0, Math.PI / 2],
  upright: [Math.PI / 2, 0, 0],
}

// Read STL bytes into a Three.js geometry, centered so orbit has a stable target.
function readGeometry(buffer) {
  const loader = new STLLoader()
  // parse() accepts the ArrayBuffer from FileReader and returns triangles.
  const geometry = loader.parse(buffer)
  const positions = geometry.getAttribute('position')
  if (!positions || positions.count === 0) {
    geometry.dispose()
    throw new Error('No triangles in this STL.')
  }
  // Smooth the shading so the part reads as a solid, then sit it on the origin.
  geometry.computeVertexNormals()
  geometry.center()
  geometry.computeBoundingSphere()
  return geometry
}

function PrintedPart({ geometry, orientation }) {
  // Fit whatever units the STL used into a view about one unit wide.
  const scale = useMemo(() => {
    const radius = geometry.boundingSphere?.radius || 1
    return 1.15 / radius
  }, [geometry])

  return (
    <group rotation={ORIENTATION[orientation] || ORIENTATION.flat}>
      <mesh geometry={geometry} scale={scale}>
        {/* DoubleSide: many STLs have faces wound both ways, and one-sided
            materials would show holes. */}
        <meshStandardMaterial
          color="#d9d3c5"
          metalness={0.08}
          roughness={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

export default function ModelViewer({ buffer, orientation }) {
  const [geometry, setGeometry] = useState(null)
  const [problem, setProblem] = useState('')

  useEffect(() => {
    if (!buffer) {
      setGeometry(null)
      setProblem('')
      return undefined
    }

    try {
      const next = readGeometry(buffer)
      setGeometry(next)
      setProblem('')
      // Drop the GPU buffer when this file is replaced or the view unmounts.
      return () => next.dispose()
    } catch (error) {
      setGeometry(null)
      setProblem(error.message || 'This file could not be read as an STL.')
      return undefined
    }
  }, [buffer])

  const triangleCount = geometry
    ? geometry.getAttribute('position').count / 3
    : 0

  return (
    <div className="viewer-stage">
      <Canvas camera={{ position: [2.5, 1.7, 2.5], fov: 42 }}>
        {/* Scene background. attach="background" paints the WebGL canvas. */}
        <color attach="background" args={['#141311']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 3]} intensity={1.35} />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />

        {/* A floor grid and XYZ axes give the orbit a sense of scale.
            Axes: red is X, green is Y, blue is Z. */}
        <gridHelper args={[4, 8, '#6d6456', '#2c2924']} />
        <axesHelper args={[1.15]} />

        {geometry ? (
          <PrintedPart geometry={geometry} orientation={orientation} />
        ) : null}

        {/* Drag rotates, scroll zooms, right-drag pans. Damping eases the motion. */}
        <OrbitControls enableDamping dampingFactor={0.08} minDistance={0.5} maxDistance={12} />
      </Canvas>

      {!geometry && !problem ? (
        <p className="viewer-message">Upload an STL to see it here.</p>
      ) : null}
      {problem ? <p className="viewer-message viewer-message-warn">{problem}</p> : null}
      {geometry ? (
        <p className="viewer-meta">{triangleCount.toLocaleString()} triangles</p>
      ) : null}
    </div>
  )
}
