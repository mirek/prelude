import * as S from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('Lines.Diff.Op is reachable as the Readme documents', () => {
  const ops = S.Lines.Diff.myers([ 'a', 'b' ], [ 'a', 'c' ])
  assert.doesNotThrow(() => S.Lines.Diff.Op.verify([ 'a', 'b' ], [ 'a', 'c' ], ops))
  assert.deepEqual(S.Lines.Diff.Op.readable(ops), [ '  a', '- b', '+ c' ])
  assert.equal(typeof S.Lines.Diff.append, 'function', 'flattened exports remain')
})
