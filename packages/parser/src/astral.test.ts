import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('character parsers keep astral characters whole', () => {
  assert.equal(P.parse(P.chars('😀'), '😀'), '😀')
  assert.equal(P.parse(P.chars('a😀'), '😀'), '😀')
  assert.equal(P.Result.failed(P.chars('😀')(P.Reader.of('\ud83d'))), true, 'a lone surrogate is not the emoji')
  assert.equal(P.parse(P.whileChars('😀😂'), '😀😂😀'), '😀😂😀')
  assert.equal((P.whileNotChars('|')(P.Reader.of('😀a😂|x')) as P.Result.Ok<string>).value, '😀a😂')
  assert.equal(P.parse(P.charRange('😀😂'), '😁'), '😁')
  assert.equal(P.parse(P.charRange('az'), 'q'), 'q')
  assert.equal(P.Result.failed(P.charRange('😀😂')(P.Reader.of('a'))), true)
})
