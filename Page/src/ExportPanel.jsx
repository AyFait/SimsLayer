// Add a format here to show it on the Export tab. The id is what Slice Model sends.
export const EXPORT_FORMATS = [
  { id: 'gcode', name: 'G-code', ext: '.gcode', detail: 'Works with most FDM printers (Marlin, Klipper, Prusa…)' },
  { id: 'bgcode', name: 'Binary G-code', ext: '.bgcode', detail: 'Compact binary G-code (Prusa and compatible firmware)' },
  { id: '3mf', name: '3MF package', ext: '.3mf', detail: 'Model + print settings in one package' },
  { id: 'photon', name: 'Anycubic Photon', ext: '.pwmx / .pws', detail: 'Resin printers from Anycubic' },
  { id: 'ctb', name: 'Chitubox', ext: '.ctb', detail: 'Resin printers using Chitubox format' },
  { id: 'goo', name: 'Elegoo Saturn / Mars', ext: '.goo', detail: 'Resin printers from Elegoo' },
]

export default function ExportPanel({ format, onChange }) {
  return (
    <div>
      <div className="sec">Export format</div>
      {EXPORT_FORMATS.map((item) => (
        <label className="fmt" key={item.id}>
          <input
            type="radio"
            name="fmt"
            value={item.id}
            checked={format === item.id}
            onChange={() => onChange(item.id)}
          />
          <span>
            <b>{item.name}</b> <span className="ext">{item.ext}</span>
            <small>{item.detail}</small>
          </span>
        </label>
      ))}
    </div>
  )
}
