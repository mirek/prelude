import * as Cmp from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('basic', () => {
  assert.equal(Cmp.number(0, 0), Cmp.eq)
  assert.equal(Cmp.number(0, -0), Cmp.eq)
  assert.equal(Cmp.number(-0, 0), Cmp.eq)
  assert.equal(Cmp.number(-0, -0), Cmp.eq)
  assert.equal(Cmp.number(0, 1), Cmp.asc)
  assert.equal(Cmp.number(1, 0), Cmp.dsc)
})

await test('nan', () => {
  assert.equal(Cmp.number(NaN, 0), Cmp.asc)
  assert.equal(Cmp.number(NaN, -Infinity), Cmp.asc)
  assert.equal(Cmp.number(NaN, Infinity), Cmp.asc)
  assert.equal(Cmp.number(NaN, NaN), Cmp.eq)
  assert.equal(Cmp.number(0, NaN), Cmp.dsc)
  assert.equal(Cmp.number(-Infinity, NaN), Cmp.dsc)
  assert.equal(Cmp.number(Infinity, NaN), Cmp.dsc)
})

await test('infinity', () => {
  assert.equal(Cmp.number(Infinity, 0), Cmp.dsc)
  assert.equal(Cmp.number(0, Infinity), Cmp.asc)
  assert.equal(Cmp.number(-Infinity, 0), Cmp.asc)
  assert.equal(Cmp.number(0, -Infinity), Cmp.dsc)
  assert.equal(Cmp.number(Infinity, Infinity), Cmp.eq)
  assert.equal(Cmp.number(Infinity, -Infinity), Cmp.dsc)
  assert.equal(Cmp.number(-Infinity, Infinity), Cmp.asc)
  assert.equal(Cmp.number(-Infinity, -Infinity), Cmp.eq)
})
