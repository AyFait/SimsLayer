// Placeholder "before → after" drawings for the home reel.
// Swap the svg strings for real renders later; the reel only reads this list.

function gear(cx, cy, outer, inner, teeth) {
  let path = ''
  const steps = teeth * 4
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2
    const radius = i % 4 === 1 || i % 4 === 2 ? outer : inner
    path += `${i ? 'L' : 'M'}${(cx + Math.cos(angle) * radius).toFixed(1)} ${(cy + Math.sin(angle) * radius).toFixed(1)}`
  }
  return `${path}Z`
}

export const PARTS = [
  {
    name: 'Mounting bracket',
    svg: '<path d="M16 16h20v44h48v24H16z"/><circle cx="26" cy="26" r="3.5"/><circle cx="26" cy="74" r="3.5"/><circle cx="74" cy="72" r="3.5"/>',
    hot: [[36, 60], [26, 30]],
  },
  {
    name: 'Spur gear',
    svg: `<path d="${gear(50, 50, 40, 31, 12)}"/><circle cx="50" cy="50" r="9"/>`,
    hot: [[50, 12], [84, 60]],
  },
  {
    name: 'Lattice block',
    svg: '<rect x="16" y="22" width="68" height="56" rx="4"/><path class="l" d="M16 50h68M50 22v56M16 36l34 14-34 14M84 36L50 50l34 14"/>',
    hot: [[50, 50], [24, 30]],
  },
  {
    name: 'Cable hook',
    svg: '<path class="l" d="M38 14v38a18 18 0 1 0 36 0v-8"/><circle cx="38" cy="14" r="5"/>',
    hot: [[38, 52], [56, 70]],
  },
  {
    name: 'Truss cube',
    svg: '<path d="M20 30l30-14 30 14v40l-30 14-30-14z"/><path class="l" d="M20 30l30 14 30-14M50 44v40"/>',
    hot: [[50, 44], [20, 52]],
  },
  {
    name: 'Pipe flange',
    svg: '<circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="14"/><circle cx="50" cy="20" r="3"/><circle cx="50" cy="80" r="3"/><circle cx="20" cy="50" r="3"/><circle cx="80" cy="50" r="3"/>',
    hot: [[50, 36], [72, 60]],
  },
]
