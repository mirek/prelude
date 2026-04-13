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
