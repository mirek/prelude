import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('implies', () => {
  const admin = (user: { admin: boolean }) => user.admin
  const archived = (user: { archived: boolean }) => user.archived
  const f = F.implies(admin, F.not(archived))
  assert.equal(f({ admin: false, archived: false }), true)
  assert.equal(f({ admin: false, archived: true }), true)
  assert.equal(f({ admin: true, archived: false }), true)
  assert.equal(f({ admin: true, archived: true }), false)
})
