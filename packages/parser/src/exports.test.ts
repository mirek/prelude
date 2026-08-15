import * as P from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('Rfc5234 and Sexp are reachable from the package index', () => {
  assert.equal(P.parse(P.Rfc5234.alpha, 'a'), 'a')
  assert.equal(P.parse(P.Rfc5234.crlf, '\r\n'), '\r\n')
  assert.deepEqual(P.Sexp.parser('(a b)'), [ 'a', 'b' ])
})
