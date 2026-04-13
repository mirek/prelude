import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('mapReason', () => {
  const p = P.mapReason(P.re(/\d/), _ => `<test>${_}</test>`)
  assert.throws(() => P.parse(p, 'a'), /<test>regexp \/\\d\/dy did not match<\/test>/)
})
