import * as Fs from './index.js'
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'

let dir: string

before(() => {
  dir = Fs.mkdtempSync(`${Fs.Os.tmpdir()}${Fs.Path.sep}`)
})

after(() => {
  Fs.rmSync(dir, { recursive: true, force: true })
})

await test('writeJsonSync', () => {
  const path = Fs.Path.join(dir, 'write-json-sync.json')
  Fs.writeJsonSync(path, { foo: 'bar' })
  assert.deepEqual(Fs.readStringSync(path), `{\n  "foo": "bar"\n}\n`)
})
