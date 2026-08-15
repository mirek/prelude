import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('Readme names match the exported API', () => {
  for (const name of [ 'parser', 'between', 'between1', 'first', 'chars', 'whileChars', 'lit', 'literal', 'either', 'join', 'map', 'maybe', 'pair', 'right', 'sep0', 'sep1', 'sep2', 'seq', 'star', 'times', 'trim', 'ws0', 'ws1' ]) {
    assert.equal(typeof (P as Record<string, unknown>)[name], 'function', name)
  }
  for (const stale of [ 'exhaustive', 'exhaustiveEmpty', 'sorrounded', 'sorrounded1', 'union', 'utf8', 'whileChar' ]) {
    assert.equal(stale in P, false, stale)
  }
})
