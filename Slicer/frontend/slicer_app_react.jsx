import React, { useState, useRef } from "react";
import { UploadCloud, Settings, Layers, PlayCircle, Sliders, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// This component assumes Tailwind CSS is available in the project.
// Default export so it can be previewed directly in the canvas.

function AnimatedPolygonBackground() {
  return (
    <motion.svg
      className="absolute inset-0 w-full h-full opacity-20"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <motion.polygon
        points="10,20 80,10 90,60 60,90 20,80"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.3"
        animate={{
          points: [
            "10,20 80,10 90,60 60,90 20,80",
            "15,10 85,20 80,70 50,95 10,75",
            "5,25 75,5 95,55 65,85 25,95",
          ],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
    </motion.svg>
  );
}

export default function SliceMasterUI() {
  const [layerThickness, setLayerThickness] = useState(0.04);
  const [hatchAngle, setHatchAngle] = useState(10);
  const [innerContours, setInnerContours] = useState(2);
  const [outerContours, setOuterContours] = useState(1);
  const [spotComp, setSpotComp] = useState(0.06);
  const [fileName, setFileName] = useState(null);
  const [pointCount, setPointCount] = useState(1248);
  const [estPrintTime, setEstPrintTime] = useState("14.2s");
  const inputRef = useRef(null);

  function handleFile(e) {
    const f = e?.target?.files?.[0] || (e?.dataTransfer && e.dataTransfer.files?.[0]);
    if (!f) return;
    setFileName(f.name);
    // placeholder: in a real app you'd parse the STL and compute point count / estimate
  }

  function triggerInput() {
    inputRef.current?.click();
  }

  return (
    <div className="min-h-screen bg-black/90 text-slate-200 font-sans p-6 relative overflow-hidden">
      <div className="max-w-[1300px] mx-auto grid grid-cols-12 gap-6">
        {/* Left controls */}
        <aside className="col-span-3 bg-zinc-900/60 rounded-2xl p-6 shadow-2xl border border-zinc-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wider mb-6">
            <Settings size={16} /> SLICING RESOLUTION
          </h2>

          <label className="block text-xs text-zinc-400">Layer Thickness</label>
          <div className="flex items-center gap-4 mt-2 mb-6">
            <input
              type="range"
              min={0.01}
              max={1}
              step={0.01}
              value={layerThickness}
              onChange={(e) => setLayerThickness(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="w-16 text-right text-sm">{layerThickness.toFixed(2)} mm</div>
          </div>

          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider mt-4 mb-2">
            <Sliders size={16} /> HATCHING STRATEGY
          </h3>

          <label className="block text-xs text-zinc-400">Base Hatch Angle</label>
          <div className="flex items-center gap-4 mt-2 mb-4">
            <input
              type="range"
              min={0}
              max={180}
              step={1}
              value={hatchAngle}
              onChange={(e) => setHatchAngle(Number(e.target.value))}
              className="w-full"
            />
            <div className="w-12 text-right text-sm">{hatchAngle}°</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 mb-6">
            <div>
              <label className="text-xs text-zinc-400">Inner Contours</label>
              <input
                type="number"
                min={0}
                value={innerContours}
                onChange={(e) => setInnerContours(Number(e.target.value))}
                className="mt-1 w-full bg-zinc-800 text-sm rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Outer Contours</label>
              <input
                type="number"
                min={0}
                value={outerContours}
                onChange={(e) => setOuterContours(Number(e.target.value))}
                className="mt-1 w-full bg-zinc-800 text-sm rounded px-3 py-2"
              />
            </div>
          </div>

          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider mt-2 mb-2">
            <Layers size={16} /> COMPENSATION
          </h3>

          <label className="block text-xs text-zinc-400">Spot Compensation</label>
          <div className="flex items-center gap-4 mt-2 mb-6">
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={spotComp}
              onChange={(e) => setSpotComp(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="w-16 text-right text-sm">{spotComp.toFixed(2)} mm</div>
          </div>

          <button
            className="mt-6 w-full bg-white text-black py-3 rounded-md font-medium shadow hover:brightness-95 flex items-center justify-center gap-2"
            onClick={() => alert("Execute slice - placeholder action")}
          >
            <PlayCircle size={18} /> EXECUTE SLICE
          </button>

          <p className="mt-3 text-xs text-zinc-500">Part will be dropped to platform (Z=0) automatically during the slicing process.</p>
        </aside>

        {/* Center upload area */}
        <main className="col-span-6 bg-gradient-to-b from-zinc-900/50 to-zinc-900/30 rounded-2xl p-8 border border-zinc-800 flex flex-col items-stretch relative overflow-hidden">
          {/* Animated polygon background */}
          <AnimatedPolygonBackground />
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wider text-zinc-400">Project: <span className="text-zinc-200">None loaded</span></div>
            <div className="text-xs text-zinc-400">Engine: Pyslm-core v2 • MEM: 124MB</div>
          </div>

          <div
            onDrop={(e) => { e.preventDefault(); handleFile(e); }}
            onDragOver={(e) => e.preventDefault()}
            className="flex-1 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 flex flex-col items-center justify-center p-6 relative"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-zinc-800/60 flex items-center justify-center">
                <UploadCloud size={34} />
              </div>
              <div className="text-sm font-semibold tracking-wider">UPLOAD CAD MODEL</div>
              <div className="text-xs text-zinc-400 mt-2">STEP, STP, or STL files</div>
              <div className="flex items-center gap-3 justify-center mt-4">
                <div className="text-xs text-zinc-500">Max 50MB</div>
                <div className="text-xs text-zinc-500">•</div>
                <div className="text-xs text-zinc-500">Automatic centering</div>
              </div>

              <div className="mt-6">
                <button
                  onClick={triggerInput}
                  className="px-4 py-2 bg-transparent border border-zinc-700 rounded text-xs hover:bg-zinc-800"
                >
                  Select file...
                </button>
                <input ref={inputRef} type="file" accept=".stl,.step,.stp" className="hidden" onChange={handleFile} />
              </div>

              {fileName && (
                <div className="mt-6 text-xs text-zinc-300">Loaded: <span className="font-medium">{fileName}</span></div>
              )}
            </motion.div>

            {/* bottom stats inside center card */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-zinc-500">
              <div>READY • ENCRYPTED</div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-zinc-400">POINT COUNT</div>
                  <div className="font-semibold text-sm text-white">{pointCount.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400">EST. PRINT TIME</div>
                  <div className="font-semibold text-sm text-white">{estPrintTime}</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right inspector */}
        <aside className="col-span-3 bg-zinc-900/60 rounded-2xl p-6 border border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-wider">LAYER INSPECTOR</h3>
            <div className="text-xs text-zinc-500">1 / -</div>
          </div>

          <div className="flex-1 rounded-md bg-zinc-900/30 border border-dashed border-zinc-800 p-4 text-zinc-500 flex items-center justify-center">
            AWAITING SLICING OUTPUT
          </div>

          <div className="mt-4 text-xs text-zinc-500">Status</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-300">
            <div className="bg-zinc-800/40 rounded p-2">Loaded: {fileName ? 'Yes' : 'No'}</div>
            <div className="bg-zinc-800/40 rounded p-2">Layers: —</div>
          </div>

          <div className="mt-6 text-xs text-zinc-500">Actions</div>
          <div className="mt-2 flex gap-2">
            <button className="flex-1 bg-zinc-800/60 rounded py-2 text-xs">Export Gcode</button>
            <button className="flex-1 bg-zinc-800/60 rounded py-2 text-xs">Preview</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
