import * as $ from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

/* eslint-disable no-sparse-arrays */

const fixed: $.Eq<number> = (a, b) => a.toFixed() === b.toFixed()

// `[ , ]` alone is typed `undefined[]`; go through `unknown` to spell sparse `number[]`s.
const sparse = (xs: unknown[]) => xs as number[]

await test('array equality never invokes the element equality with a hole', () => {
  const eq = $.array(fixed)
  assert.equal(eq(sparse([ , ]), [ 2 ]), false)
  assert.equal(eq([ 2 ], sparse([ , ])), false)
  assert.equal(eq(sparse([ 1, , 3 ]), [ 1, 2, 3 ]), false)
  assert.equal(eq([ 1, 2, 3 ], [ 1, 2, 3 ]), true)
})

await test('paired holes are equal', () => {
  const eq = $.array(fixed)
  assert.equal(eq(sparse([ , ]), sparse([ , ])), true)
  assert.equal(eq(sparse([ 1, , 3 ]), sparse([ 1, , 3 ])), true)
})

await test('a hole equals an explicit undefined, mirroring record', () => {
  const eq = $.array<number | undefined>($.undefinedOr(fixed))
  assert.equal(eq(sparse([ , ]), [ undefined ]), true)
  assert.equal(eq([ undefined ], sparse([ , ])), true)
  assert.equal(eq(sparse([ , ]), [ 1 ]), false)
})

await test('tuple equality never invokes an element equality with a hole', () => {
  const eq = $.tuple<[ number, number ]>(fixed, fixed)
  const pair = (xs: unknown[]) => xs as [ number, number ]
  assert.equal(eq(pair([ , 2 ]), [ 1, 2 ]), false)
  assert.equal(eq([ 1, 2 ], pair([ 1, , ])), false)
  assert.equal(eq(pair([ , 2 ]), pair([ , 2 ])), true)
  assert.equal(eq([ 1, 2 ], [ 1, 2 ]), true)
  assert.equal(eq([ 1, 2 ], [ 1, 3 ]), false)
})

await test('inherited numeric properties do not make holes look present', () => {
  const eq = $.array((a: number, b: number) => a.toFixed() === b.toFixed())
  const proto = Object.create(Array.prototype)
  proto[0] = 7
  const withHole = Object.setPrototypeOf([, 1], proto) as number[]
  const withValue = Object.setPrototypeOf([7, 1], proto) as number[]
  assert.equal(eq(withHole, withValue), false)
  assert.equal(eq(withValue, withHole), false)
  assert.equal(eq(withHole, Object.setPrototypeOf([, 1], proto) as number[]), true)
  const tuple = $.tuple<[ number ]>((a: number, b: number) => a.toFixed() === b.toFixed())
  assert.equal(tuple(withHole as [number], withValue as [number]), false)
  assert.equal(tuple(withHole as [number], withHole as [number]), true)
})
