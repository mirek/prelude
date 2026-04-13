import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('whileNotChars', () => {
  const parser = P.parser(P.whileNotChars(' /<>', 1))
  assert.deepEqual(parser('foo'), 'foo')
})
