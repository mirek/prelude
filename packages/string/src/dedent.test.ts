import * as S from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('dedent', () => {
  assert.deepEqual(S.dedent(`
    hello
      world
    !
  `), 'hello\n  world\n!')
})

await test('removes every blank line at the beginning and the end', () => {
  assert.equal(S.dedent('\n\n  a\n\n'), 'a')
  assert.equal(S.dedent('\n  \n  a\n  b\n \n\n'), 'a\nb')
  assert.equal(S.dedent('  a\n\n  b'), 'a\n\nb', 'inner blank lines are kept')
})

await test('removes many leading blank lines in linear time', () => {
  const start = performance.now()
  assert.equal(S.dedent('\n'.repeat(200_000) + 'x'), 'x')
  const elapsed = performance.now() - start
  assert.ok(elapsed < 200, `took ${elapsed.toFixed(0)}ms`)
})
