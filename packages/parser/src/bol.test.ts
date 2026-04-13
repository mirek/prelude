import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('bol', () => {
  const p = P.parser(P.all(P.map(P.seq(P.bol, '#', P.line), _ => _[2])))
  assert.deepEqual(p('#zero\nfoo\n#one\n #not\n#two'), [
    'zero',
    'one',
    'two'
  ])
})
