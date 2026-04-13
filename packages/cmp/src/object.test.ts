import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('object', () => {
  const cmp = Cmp.object({
    major: Cmp.number,
    minor: Cmp.number,
    patch: Cmp.number
  })
  assert.equal(cmp(
    { major: 1, minor: 0, patch: 0 },
    { major: 1, minor: 0, patch: 0 }
  ), Cmp.eq)
  assert.equal(cmp(
    { major: 1, minor: 0, patch: 0 },
    { major: 1, minor: 0, patch: 1 }
  ), Cmp.asc)
  assert.equal(cmp(
    { major: 1, minor: 0, patch: 1 },
    { major: 1, minor: 0, patch: 0 }
  ), Cmp.dsc)
  assert.equal(cmp(
    { major: 1, minor: 0, patch: 0 },
    { major: 1, minor: 1, patch: 0 }
  ), Cmp.asc)
  assert.equal(cmp(
    { major: 1, minor: 1, patch: 0 },
    { major: 1, minor: 0, patch: 0 }
  ), Cmp.dsc)
  assert.equal(cmp(
    { major: 1, minor: 0, patch: 0 },
    { major: 2, minor: 0, patch: 0 }
  ), Cmp.asc)
  assert.equal(cmp(
    { major: 2, minor: 0, patch: 0 },
    { major: 1, minor: 0, patch: 0 }
  ), Cmp.dsc)
})

await test('object with optionals', () => {
  const cmp = Cmp.object({
    major: Cmp.number,
    minor: Cmp.nullOr(Cmp.number),
    patch: Cmp.nullOr(Cmp.number)
  })
  assert.equal(cmp(
    { major: 1, minor: 0, patch: 0 },
    { major: 1, minor: 0, patch: 0 }
  ), Cmp.eq)
  assert.equal(cmp(
    { major: 1, minor: 0, patch: 0 },
    { major: 1, minor: 0, patch: null }
  ), Cmp.dsc)
  assert.equal(cmp(
    { major: 1, minor: 0, patch: null },
    { major: 1, minor: 0, patch: 0 }
  ), Cmp.asc)
  assert.equal(cmp(
    { major: 1, minor: 0, patch: null },
    { major: 1, minor: null, patch: 0 }
  ), Cmp.dsc)
})
