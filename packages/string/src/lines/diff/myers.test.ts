import myers from './myers.js'
import * as Op from './op.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

function t(A: string[], B: string[]) {
  const diff = myers(A, B)
  try {
    Op.verify(A, B, diff)
  } catch (err) {
    console.error(err?.['message'] ?? err)
    console.error(Op.dump(A, B, diff))
    throw err
  }
  return Op.readable(diff)
}

await test('simple', () => {
  const A = ['a', 'b', 'c', 'd']
  const B = ['a', 'x', 'c', 'y', 'd']
  assert.deepEqual(t(A, B), ['  a', '- b', '+ x', '  c', '+ y', '  d'])
})

await test('empty sequences', () => {
  const A: string[] = []
  const B: string[] = []
  assert.deepEqual(t(A, B), [])
})

await test('one sequence empty', () => {
  const A = ['a', 'b', 'c']
  const B: string[] = []
  assert.deepEqual(t(A, B), ['- a', '- b', '- c'])

  const A2: string[] = []
  const B2 = ['x', 'y', 'z']
  assert.deepEqual(t(A2, B2), ['+ x', '+ y', '+ z'])
})

await test('identical sequences', () => {
  const A = ['a', 'b', 'c']
  const B = ['a', 'b', 'c']
  assert.deepEqual(t(A, B), ['  a', '  b', '  c'])
})

await test('no common elements', () => {
  const A = ['a', 'b', 'c']
  const B = ['x', 'y', 'z']
  assert.deepEqual(t(A, B), ['- a', '- b', '- c', '+ x', '+ y', '+ z'])
})

await test('single element sequences', () => {
  assert.deepEqual(t(['a'], ['a']), ['  a'])
  assert.deepEqual(t(['a'], ['b']), ['- a', '+ b'])
  assert.deepEqual(t(['a'], []), ['- a'])
  assert.deepEqual(t([], ['b']), ['+ b'])
})

await test('repeated elements', () => {
  const A = ['a', 'b', 'a', 'c']
  const B = ['a', 'x', 'a', 'y']
  assert.deepEqual(t(A, B), ['  a', '- b', '+ x', '  a', '- c', '+ y'])
})

await test('leading or trailing changes', () => {
  const A1 = ['x', 'a', 'b', 'c']
  const B1 = ['a', 'b', 'c']
  assert.deepEqual(t(A1, B1), ['- x', '  a', '  b', '  c'])

  const A2 = ['a', 'b', 'c']
  const B2 = ['a', 'b', 'c', 'y']
  assert.deepEqual(t(A2, B2), ['  a', '  b', '  c', '+ y'])
})

await test('multiple changes', () => {
  const A = ['a', 'b', 'c', 'd', 'e']
  const B = ['a', 'x', 'c', 'y', 'e']
  assert.deepEqual(t(A, B), ['  a', '- b', '+ x', '  c', '- d', '+ y', '  e'])
})

await test('subset sequences', () => {
  const A1 = ['a', 'b', 'c']
  const B1 = ['a', 'c']
  assert.deepEqual(t(A1, B1), ['  a', '- b', '  c'])

  const A2 = ['a', 'c']
  const B2 = ['a', 'b', 'c']
  assert.deepEqual(t(A2, B2), ['  a', '+ b', '  c'])
})

await test('special characters', () => {
  const A = ['', 'a', ' ', 'b']
  const B = ['a', '', 'b', ' ']
  assert.deepEqual(t(A, B), ['- ', '  a', '-  ', '+ ', '  b', '+  '])
})

// Test Case 12: Long Unchanged Segment with Small Changes
await test('long unchanged segment with small changes', () => {
  const A = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
  const B = ['a', 'b', 'x', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
  assert.deepEqual(t(A, B), ['  a', '  b', '- c', '+ x', '  d', '  e', '  f', '  g', '  h', '  i', '  j', '  k'])
})

// Test Case 13: Interleaved Insertions and Deletions
await test('interleaved insertions and deletions', () => {
  const A = ['a', 'b', 'c', 'd']
  const B = ['x', 'a', 'y', 'b', 'z', 'd']
  assert.deepEqual(t(A, B), ['+ x', '  a', '+ y', '  b', '- c', '+ z', '  d'])
})

// Test Case 14: Alternating Pattern
await test('alternating pattern', () => {
  const A = ['a', 'b', 'a', 'b', 'a', 'b']
  const B = ['b', 'a', 'b', 'a', 'b', 'a']
  assert.deepEqual(t(A, B), ['- a', '  b', '  a', '  b', '  a', '  b', '+ a'])
})

// Test Case 15: Single Change in Middle of Long Sequence
await test('single change in middle of long sequence', () => {
  const A = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const B = ['1', '2', '3', '4', 'x', '6', '7', '8', '9', '10']
  assert.deepEqual(t(A, B), ['  1', '  2', '  3', '  4', '- 5', '+ x', '  6', '  7', '  8', '  9', '  10'])
})

// Test Case 16: All Elements Identical Except One Insertion
await test('all elements identical except one insertion', () => {
  const A = ['a', 'b', 'c', 'd']
  const B = ['a', 'b', 'x', 'c', 'd']
  assert.deepEqual(t(A, B), ['  a', '  b', '+ x', '  c', '  d'])
})

// Test Case 17: Sequences with Only Whitespace Differences
await test('sequences with only whitespace differences', () => {
  const A = ['hello', ' world', 'foo ']
  const B = ['hello ', 'world', ' foo']
  assert.deepEqual(t(A, B), ['- hello', '-  world', '- foo ', '+ hello ', '+ world', '+  foo'])
})

// Test Case 18: Very Short vs Very Long Sequence
await test('very short vs very long sequence', () => {
  const A = ['a']
  const B = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
  assert.deepEqual(t(A, B), ['  a', '+ b', '+ c', '+ d', '+ e', '+ f', '+ g', '+ h', '+ i', '+ j'])
})

// Test Case 19: Sequences with Duplicate Blocks
await test('sequences with duplicate blocks', () => {
  const A = ['a', 'b', 'a', 'b', 'c']
  const B = ['a', 'b', 'c', 'a', 'b']
  assert.deepEqual(t(A, B), ['  a', '  b', '+ c', '  a', '  b', '- c'])
})

// Test Case 20: Random Noise Between Matching Ends
await test('random noise between matching ends', () => {
  const A = ['start', 'x', 'y', 'z', 'end']
  const B = ['start', 'p', 'q', 'end']
  assert.deepEqual(t(A, B), ['  start', '- x', '- y', '- z', '+ p', '+ q', '  end'])
})
