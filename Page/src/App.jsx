/*
  SimsLayer study screen.

  Everything on this page stays in the browser. The STL is read locally,
  the settings are React state, and the stress numbers are placeholders.
  There is no server call and no real finite-element solve.
*/
import { useEffect, useRef, useState } from 'react'
import ModelViewer from './ModelViewer.jsx'

const STAGES = [
  { id: 'slice', name: 'Slice', detail: 'Layer the solid' },
  { id: 'mesh', name: 'Mesh', detail: 'Build elements' },
  { id: 'fea', name: 'FEA', detail: 'Apply the load' },
  { id: 'results', name: 'Results', detail: 'Read the study' },
]

const MATERIALS = ['PLA', 'PETG', 'ABS', 'Nylon', 'AlSi10Mg']

// Stand-in numbers so the results panel has something to show.
// The formula is made up. It is not a stress calculation.
function sampleResults(input) {
  const stiffness = {
    PLA: 2.3,
    PETG: 1.8,
    ABS: 1.6,
    Nylon: 1.2,
    AlSi10Mg: 70,
  }[input.material]
  const direction = { X: 1.15, Y: 1.1, Z: 0.85 }[input.loadAxis]
  const pose = { flat: 1, edge: 1.25, upright: 1.55 }[input.orientation]
  const supportFactor = { bed: 1, edges: 1.2, corners: 1.45 }[input.support]
  const infillFactor = 1.6 - input.infill / 100
  const stress = (input.load / stiffness) * direction * pose * supportFactor * infillFactor * 0.35
  const displacement = stress * input.layerHeight * 0.012

  return {
    stress: stress.toFixed(2),
    displacement: displacement.toFixed(3),
  }
}

function stageState(index, stageIndex, hasResults) {
  if (stageIndex < 0) return 'waiting'
  if (hasResults || index < stageIndex) return 'done'
  if (index === stageIndex) return 'active'
  return 'waiting'
}

export default function App() {
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [fileError, setFileError] = useState('')
  const [stlBuffer, setStlBuffer] = useState(null)
  const [dragging, setDragging] = useState(false)

  const [material, setMaterial] = useState('PLA')
  const [layerHeight, setLayerHeight] = useState(0.2)
  const [orientation, setOrientation] = useState('flat')
  const [infill, setInfill] = useState(20)
  const [load, setLoad] = useState(100)
  const [loadAxis, setLoadAxis] = useState('Z')
  const [support, setSupport] = useState('bed')

  const [stageIndex, setStageIndex] = useState(-1)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const timers = useRef([])

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout)
  }, [])

  function readStl(file) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.stl')) {
      setFileError('Choose a file that ends in .stl.')
      return
    }

    setFileError('')
    setFileName(file.name)
    const kilobytes = Math.max(1, Math.round(file.size / 1024))
    setFileSize(`${kilobytes.toLocaleString()} KB`)

    const reader = new FileReader()
    reader.onload = () => setStlBuffer(reader.result)
    reader.onerror = () => setFileError('The browser could not read that file.')
    reader.readAsArrayBuffer(file)
  }

  function onDrop(event) {
    event.preventDefault()
    setDragging(false)
    readStl(event.dataTransfer.files?.[0])
  }

  function runStudy() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setRunning(true)
    setResults(null)
    setStageIndex(0)

    // Walk the four stages locally so the progress bar has a sequence to show.
    const stepMs = 420
    for (let index = 1; index < STAGES.length; index += 1) {
      timers.current.push(setTimeout(() => setStageIndex(index), stepMs * index))
    }
    timers.current.push(
      setTimeout(() => {
        setResults(sampleResults({ material, layerHeight, orientation, infill, load, loadAxis, support }))
        setRunning(false)
      }, stepMs * STAGES.length),
    )
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="brand">SimsLayer</p>
          <p className="tagline">Stress studies for 3D-printed parts</p>
        </div>
        <p className="topbar-note">Local only · no solver connected</p>
      </header>

      <section className="overview">
        <h1>A bench for printed-part strength</h1>
        <p>
          SimsLayer is where you look at how a 3D-printed part carries a load.
          Printed parts are built in layers, so the material, layer height, bed
          orientation, and infill all change the answer. Bring an STL, set the
          print and the load, then follow the study from slice to result.
          The model view is real. The stress numbers are placeholders until a
          solver is connected.
        </p>
      </section>

      <ol className="pipeline">
        {STAGES.map((stage, index) => {
          const state = stageState(index, stageIndex, Boolean(results))
          return (
            <li key={stage.id} className={`stage stage-${state}`}>
              <span className="stage-index">{index + 1}</span>
              <span>
                <span className="stage-name">{stage.name}</span>
                <span className="stage-detail">{stage.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="workspace">
        <section className="panel setup-panel">
          <h2>Model</h2>
          <label
            className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span>Drop an STL here, or choose a file</span>
            <input
              type="file"
              accept=".stl,model/stl"
              onChange={(event) => readStl(event.target.files?.[0])}
            />
          </label>
          {fileName ? (
            <p className="file-name">
              {fileName}
              <span>{fileSize}</span>
            </p>
          ) : (
            <p className="hint">No file yet. The name appears here after you pick one.</p>
          )}
          {fileError ? <p className="hint hint-warn">{fileError}</p> : null}

          <h2>Settings</h2>
          <label className="field">
            Material
            <select value={material} onChange={(event) => setMaterial(event.target.value)}>
              {MATERIALS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            Layer height
            <span className="field-row">
              <input
                type="range"
                min="0.08"
                max="0.4"
                step="0.02"
                value={layerHeight}
                onChange={(event) => setLayerHeight(Number(event.target.value))}
              />
              <span className="readout">{layerHeight.toFixed(2)} mm</span>
            </span>
          </label>

          <label className="field">
            Print orientation
            <select value={orientation} onChange={(event) => setOrientation(event.target.value)}>
              <option value="flat">Flat on the bed</option>
              <option value="edge">On edge</option>
              <option value="upright">Standing up</option>
            </select>
          </label>

          <label className="field">
            Infill
            <span className="field-row">
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={infill}
                onChange={(event) => setInfill(Number(event.target.value))}
              />
              <span className="readout">{infill}%</span>
            </span>
          </label>

          <div className="field-pair">
            <label className="field">
              Load
              <span className="field-row">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={load}
                  onChange={(event) => setLoad(Number(event.target.value) || 0)}
                />
                <span className="readout">N</span>
              </span>
            </label>
            <label className="field">
              Axis
              <select value={loadAxis} onChange={(event) => setLoadAxis(event.target.value)}>
                <option value="X">X</option>
                <option value="Y">Y</option>
                <option value="Z">Z</option>
              </select>
            </label>
          </div>

          <label className="field">
            Support
            <select value={support} onChange={(event) => setSupport(event.target.value)}>
              <option value="bed">Fixed to the bed</option>
              <option value="edges">Held at the edges</option>
              <option value="corners">Held at the corners</option>
            </select>
          </label>

          <button type="button" className="run-button" onClick={runStudy} disabled={running}>
            {running ? 'Running study…' : 'Run study'}
          </button>
        </section>

        <section className="panel viewer-panel">
          <div className="panel-heading">
            <h2>Viewer</h2>
            <p>Drag to rotate. Scroll to zoom.</p>
          </div>
          <ModelViewer buffer={stlBuffer} orientation={orientation} />
        </section>

        <section className="panel results-panel">
          <h2>Results</h2>
          <p className="hint">Placeholder values. They change with the settings, but they are not a solve.</p>
          {results ? (
            <>
              <article className="metric">
                <p>Peak stress</p>
                <strong>{results.stress}</strong>
                <span>MPa · sample von Mises</span>
              </article>
              <article className="metric">
                <p>Max displacement</p>
                <strong>{results.displacement}</strong>
                <span>mm · sample</span>
              </article>
              <p className="hint">
                {material}, {load} N on {loadAxis}, {infill}% infill, {layerHeight.toFixed(2)} mm layers.
              </p>
            </>
          ) : (
            <p className="results-empty">
              {running ? 'Walking the stages…' : 'Run a study to fill this panel.'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
