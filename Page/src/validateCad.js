// Check a file is really an STL or STEP, not just a renamed picture or zip.
// Returns { ok: true, kind, detail } or { ok: false, reason }.

const MAX_BYTES = 100 * 1024 * 1024

const BAD_SIGNATURES = [
  ['a ZIP/Office archive', [0x50, 0x4b]],
  ['a PDF', [0x25, 0x50, 0x44, 0x46]],
  ['an image (PNG)', [0x89, 0x50, 0x4e, 0x47]],
  ['an image (JPEG)', [0xff, 0xd8, 0xff]],
  ['an image (GIF)', [0x47, 0x49, 0x46]],
  ['an executable', [0x4d, 0x5a]],
  ['a GZIP archive', [0x1f, 0x8b]],
]

const startsWith = (bytes, signature) => signature.every((value, index) => bytes[index] === value)
const asText = (bytes) => new TextDecoder('latin1').decode(bytes)
const fail = (reason) => ({ ok: false, reason })
const pass = (kind, detail) => ({ ok: true, kind, detail })

function printableShare(bytes, limit) {
  const sample = Math.min(bytes.length, limit)
  if (sample === 0) return 0
  let printable = 0
  for (let i = 0; i < sample; i += 1) {
    const code = bytes[i]
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code < 127)) printable += 1
  }
  return printable / sample
}

export async function validateCad(file) {
  const extension = (file.name.split('.').pop() || '').toLowerCase()
  if (!['stl', 'step', 'stp'].includes(extension)) {
    return fail('Only STEP (.step, .stp) and STL (.stl) files are supported.')
  }
  if (file.size === 0) return fail('This file is empty.')
  if (file.size > MAX_BYTES) return fail('This file is larger than 100MB.')

  const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer())
  const tail = new Uint8Array(await file.slice(Math.max(0, file.size - 4096)).arrayBuffer())

  for (const [name, signature] of BAD_SIGNATURES) {
    if (startsWith(head, signature)) {
      return fail(`This looks like ${name}, not a CAD file, even though it is named .${extension}.`)
    }
  }

  return extension === 'stl' ? validateStl(file, head, tail) : validateStep(head, tail)
}

async function validateStl(file, head, tail) {
  // Binary STL: 80-byte header, a triangle count, then exactly 50 bytes per triangle.
  if (file.size >= 84) {
    const sample = await file.slice(0, Math.min(file.size, 84 + 50 * 200)).arrayBuffer()
    const view = new DataView(sample)
    const count = view.getUint32(80, true)
    if (count > 0 && 84 + 50 * count === file.size) {
      let nonZero = false
      const check = Math.min(count, 200)
      for (let i = 0; i < check; i += 1) {
        for (let k = 0; k < 12; k += 1) {
          const value = view.getFloat32(84 + i * 50 + k * 4, true)
          if (!Number.isFinite(value) || Math.abs(value) > 1e9) {
            return fail('The triangle data in this STL is corrupted.')
          }
          if (value !== 0) nonZero = true
        }
      }
      if (!nonZero) return fail('This STL contains no usable geometry.')
      return pass('Binary STL', `${count.toLocaleString()} triangles`)
    }
  }

  const text = asText(head)
  const trimmed = text.trimStart()
  if (/^solid\b/i.test(trimmed)) {
    const printable = printableShare(head, 2048)
    const hasFacet = /facet\s+normal/i.test(text)
      && /vertex\s+[-+0-9.eE]+\s+[-+0-9.eE]+\s+[-+0-9.eE]+/i.test(text)
    const hasEnd = /endsolid/i.test(asText(tail))
    if (printable > 0.95 && hasFacet && hasEnd) return pass('ASCII STL', 'facet/vertex structure found')
    if (printable > 0.95 && hasFacet) {
      return fail("This ASCII STL appears to be cut off (no 'endsolid' at the end).")
    }
  }

  return fail('This does not look like a valid STL file (neither binary nor ASCII STL structure was found).')
}

function validateStep(head, tail) {
  const text = asText(head)
  const trimmed = text.trimStart()
  if (!/^ISO-10303-21;/.test(trimmed)) {
    return fail('This does not look like a STEP file (missing the ISO-10303-21 header).')
  }
  if (printableShare(head, 4096) < 0.95) {
    return fail('This file contains binary data and is not a text STEP file.')
  }
  if (!/HEADER;/.test(text) || !/FILE_SCHEMA/.test(text)) {
    return fail('The STEP header section is missing or damaged.')
  }
  if (!/END-ISO-10303-21;/.test(asText(tail))) {
    return fail('This STEP file appears to be cut off (missing END-ISO-10303-21;).')
  }
  const schema = (text.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']*)'/) || [])[1]
  return pass('STEP', schema ? `schema: ${schema}` : 'STEP structure found')
}
