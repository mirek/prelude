import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('predicate', () => {
  const predicate = $.predicate($.tuple($.exact({
    email: $.nullishOr($.string),
    password: $.nullishOr($.string),
    token: $.nullishOr($.string),
    version: $.nullishOr($.string)
  })))
  assert.equal(predicate([{ token: '123', 'version': '0.0.1' }]), true)
  assert.equal(predicate({ token: '123', 'version': '0.0.1' }), false)
})
