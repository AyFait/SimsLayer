import assert from 'node:assert/strict'
import test from 'node:test'
import { validateCad } from './validateCad.js'

function fileFrom(name, bytes) {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes
  return new File([data], name)
}

function binaryStl() {
  const count = 1
  const buffer = new ArrayBuffer(84 + 50 * count)
  const view = new DataView(buffer)
  view.setUint32(80, count, true)
  const offset = 84 + 12
  const coords = [0, 0, 0, 1, 0, 0, 0, 1, 0]
  coords.forEach((value, index) => view.setFloat32(offset + index * 4, value, true))
  return new Uint8Array(buffer)
}

const asciiStl = `solid block
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 1 0 0
      vertex 0 1 0
    endloop
  endfacet
endsolid block
`

const step = `ISO-10303-21;
HEADER;
FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
ENDSEC;
DATA;
ENDSEC;
END-ISO-10303-21;
`

test('accepts a binary STL', async () => {
  const result = await validateCad(fileFrom('block.stl', binaryStl()))
  assert.equal(result.ok, true)
  assert.equal(result.kind, 'Binary STL')
  assert.match(result.detail, /1 triangle/)
})

test('accepts an ASCII STL', async () => {
  const result = await validateCad(fileFrom('block.stl', asciiStl))
  assert.equal(result.ok, true)
  assert.equal(result.kind, 'ASCII STL')
})

test('accepts a STEP file', async () => {
  const result = await validateCad(fileFrom('part.step', step))
  assert.equal(result.ok, true)
  assert.equal(result.kind, 'STEP')
  assert.equal(result.detail, 'schema: AUTOMOTIVE_DESIGN')
})

test('rejects a truncated STEP file', async () => {
  const cut = step.replace('END-ISO-10303-21;', '')
  const result = await validateCad(fileFrom('part.stp', cut))
  assert.equal(result.ok, false)
  assert.match(result.reason, /cut off/)
})

test('rejects a truncated ASCII STL', async () => {
  const cut = asciiStl.replace('endsolid block\n', '')
  const result = await validateCad(fileFrom('block.stl', cut))
  assert.equal(result.ok, false)
  assert.match(result.reason, /endsolid/)
})

test('rejects random text named .stl', async () => {
  const result = await validateCad(fileFrom('notes.stl', 'hello this is just some notes\n'))
  assert.equal(result.ok, false)
  assert.match(result.reason, /does not look like a valid STL/)
})

test('rejects a PNG renamed .stl', async () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
  const result = await validateCad(fileFrom('photo.stl', png))
  assert.equal(result.ok, false)
  assert.match(result.reason, /PNG/)
})

test('rejects the wrong extension', async () => {
  const result = await validateCad(fileFrom('block.obj', asciiStl))
  assert.equal(result.ok, false)
  assert.match(result.reason, /Only STEP/)
})

test('rejects an empty file', async () => {
  const result = await validateCad(new File([], 'empty.stl'))
  assert.equal(result.ok, false)
  assert.match(result.reason, /empty/)
})
