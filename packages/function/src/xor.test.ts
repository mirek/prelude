import * as F from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('xor', () => {
  const admin = (user: { admin: boolean }) => user.admin
  const adminRole = (user: { role: string }) => user.role === 'ADMIN'
  const f = F.not(F.xor(admin, adminRole))
  assert.equal(f({ admin: false, role: 'USER' }), true)
  assert.equal(f({ admin: false, role: 'ADMIN' }), false)
  assert.equal(f({ admin: true, role: 'USER' }), false)
  assert.equal(f({ admin: true, role: 'ADMIN' }), true)
})
