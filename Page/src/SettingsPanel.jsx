import { forwardRef, useImperativeHandle, useState } from 'react'
import ExportPanel from './ExportPanel.jsx'

function layerLabel(value) {
  return `${Number(value).toFixed(2).replace(/0$/, '')}mm`
}

const SettingsPanel = forwardRef(function SettingsPanel(_props, ref) {
  const [tab, setTab] = useState('slice')
  const [layerHeight, setLayerHeight] = useState(0.2)
  const [walls, setWalls] = useState(3)
  const [topLayers, setTopLayers] = useState(4)
  const [bottomLayers, setBottomLayers] = useState(4)
  const [infillDensity, setInfillDensity] = useState(20)
  const [infillPattern, setInfillPattern] = useState('grid')
  const [supportOn, setSupportOn] = useState(false)
  const [supportAmount, setSupportAmount] = useState(50)
  const [supportDensity, setSupportDensity] = useState(15)
  const [printSpeed, setPrintSpeed] = useState(60)
  const [material, setMaterial] = useState('PLA')
  const [exportFormat, setExportFormat] = useState('gcode')

  useImperativeHandle(ref, () => ({
    getSettings() {
      return {
        layerHeight: Number(layerHeight),
        walls: Number(walls),
        topLayers: Number(topLayers),
        bottomLayers: Number(bottomLayers),
        infillDensity: Number(infillDensity),
        infillPattern,
        support: supportOn ? { amount: Number(supportAmount), density: Number(supportDensity) } : null,
        printSpeed: Number(printSpeed),
        material,
        exportFormat,
      }
    },
  }))

  return (
    <div className="panel">
      <div className="tabs" role="tablist" aria-label="Settings">
        <button type="button" role="tab" aria-selected={tab === 'slice'} className={tab === 'slice' ? 'on' : ''} onClick={() => setTab('slice')}>
          Slice
        </button>
        <button type="button" role="tab" aria-selected={tab === 'export'} className={tab === 'export' ? 'on' : ''} onClick={() => setTab('export')}>
          Export
        </button>
      </div>

      {tab === 'slice' ? (
        <div role="tabpanel">
          <div className="sec">Layer settings</div>
          <div className="row"><span>Layer height</span><output>{layerLabel(layerHeight)}</output></div>
          <input type="range" min="0.05" max="0.4" step="0.05" value={layerHeight} aria-label="Layer height" onChange={(event) => setLayerHeight(event.target.value)} />
          <div className="grid3">
            <label className="f">Wall count
              <input type="number" min="1" max="10" value={walls} onChange={(event) => setWalls(event.target.value)} />
            </label>
            <label className="f">Top layers
              <input type="number" min="0" max="20" value={topLayers} onChange={(event) => setTopLayers(event.target.value)} />
            </label>
            <label className="f">Bottom layers
              <input type="number" min="0" max="20" value={bottomLayers} onChange={(event) => setBottomLayers(event.target.value)} />
            </label>
          </div>

          <div className="sec">Infill</div>
          <div className="row"><span>Density</span><output>{infillDensity}%</output></div>
          <input type="range" min="0" max="100" step="1" value={infillDensity} aria-label="Infill density" onChange={(event) => setInfillDensity(event.target.value)} />
          <label className="f pattern">Pattern
            <select value={infillPattern} onChange={(event) => setInfillPattern(event.target.value)}>
              <option value="grid">Grid</option>
              <option value="lines">Lines</option>
              <option value="triangles">Triangles</option>
              <option value="cuboid">Cuboid</option>
              <option value="gyroid">Gyroid</option>
              <option value="honeycomb">Honeycomb</option>
            </select>
          </label>

          <div className="sec">Support</div>
          <label className="switch">Enable Support
            <input type="checkbox" checked={supportOn} onChange={(event) => setSupportOn(event.target.checked)} />
          </label>
          {supportOn ? (
            <div>
              <div className="row"><span>Support amount</span><output>{supportAmount}%</output></div>
              <input type="range" min="0" max="100" value={supportAmount} aria-label="Support amount" onChange={(event) => setSupportAmount(event.target.value)} />
              <div className="row"><span>Support density</span><output>{supportDensity}%</output></div>
              <input type="range" min="5" max="60" value={supportDensity} aria-label="Support density" onChange={(event) => setSupportDensity(event.target.value)} />
            </div>
          ) : null}

          <div className="sec">Print settings</div>
          <div className="row"><span>Print speed</span><output>{printSpeed}mm/s</output></div>
          <input type="range" min="10" max="200" step="5" value={printSpeed} aria-label="Print speed" onChange={(event) => setPrintSpeed(event.target.value)} />
          <label className="f pattern">Material
            <select value={material} onChange={(event) => setMaterial(event.target.value)}>
              <optgroup label="Standard">
                <option>PLA</option>
                <option>ABS</option>
                <option>PETG</option>
              </optgroup>
              <optgroup label="Flexible">
                <option>TPE</option>
                <option>TPU (flexible PU)</option>
              </optgroup>
              <optgroup label="Engineering">
                <option>Nylon</option>
                <option>ASA (UV-resistant)</option>
                <option>Carbon-fibre Nylon (high strength)</option>
              </optgroup>
              <optgroup label="Resin">
                <option>Resin (SLA)</option>
              </optgroup>
            </select>
          </label>
        </div>
      ) : (
        <div role="tabpanel">
          <ExportPanel format={exportFormat} onChange={setExportFormat} />
        </div>
      )}
    </div>
  )
})

export default SettingsPanel
