import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('mapFailure', () => {
  const p = P.mapFailure(P.re(/\d/), _ => P.Result.fail(_.reader, `${_.reason}, at offset ${_.reader.offset} for input "${_.reader.input}"`))
  assert.throws(() => P.parse(p, 'a'), /regexp \/\\d\/dy did not match, at offset 0 for input "a"/)
})

