import * as Testing from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('the generator is deterministic per seed and derived streams differ per trial', () => {
  const a = Testing.prng(7)
  const b = Testing.prng(7)
  assert.deepEqual([a.next(), a.next(), a.int(10), a.between(3, 5)], [b.next(), b.next(), b.int(10), b.between(3, 5)])
  assert.notEqual(Testing.prng(7).derive(0).next(), Testing.prng(7).derive(1).next())
  assert.equal(Testing.prng(7).derive(3).next(), Testing.prng(7).derive(3).next())
})

await test('int, between, pick, shuffled and string stay within their bounds', () => {
  const rng = Testing.prng(1)
  for (let i = 0; i < 1000; i++) {
    const n = rng.int(5)
    assert.ok(n >= 0 && n < 5 && Number.isInteger(n))
    const m = rng.between(-2, 2)
    assert.ok(m >= -2 && m <= 2 && Number.isInteger(m))
    assert.ok([ 'a', 'b' ].includes(rng.pick([ 'a', 'b' ])))
    const s = rng.string('xy', 0, 3)
    assert.ok(s.length <= 3 && /^[xy]*$/.test(s))
  }
  assert.deepEqual(rng.shuffled([ 1, 2, 3, 4 ]).sort((a, b) => a - b), [ 1, 2, 3, 4 ])
  assert.throws(() => rng.int(0), RangeError)
  assert.throws(() => rng.pick([]), RangeError)
})

await test('checkTrace passes when every trace passes', async () => {
  let runs = 0
  await Testing.checkTrace({
    seed: 3,
    trials: 5,
    fixed: true,
    length: 4,
    op: rng => rng.int(3),
    run: ops => { runs++; assert.equal(ops.length, 4) }
  })
  assert.equal(runs, 5)
})

await test('checkTrace shrinks a failing trace to a minimal reproduction and reports the seed', async () => {
  // Fails whenever the trace contains a 2 followed (not necessarily directly) by a 5.
  const run = (ops: readonly number[]) => {
    const i = ops.indexOf(2)
    if (i !== -1 && ops.slice(i + 1).includes(5)) {
      throw new Error('2 then 5')
    }
  }
  await assert.rejects(
    Testing.checkTrace({ seed: 11, trials: 50, fixed: true, length: 30, op: rng => rng.int(6), run }),
    (error: unknown) => {
      assert.ok(error instanceof Testing.TraceError)
      assert.deepEqual(error.ops, [ 2, 5 ])
      assert.equal(error.seed, 11)
      assert.match(error.message, /seed 11, trial \d+, 30 ops, shrunk to 2/)
      assert.match(error.message, /\[2,5\]/)
      assert.match(error.message, /Cause: 2 then 5/)
      return true
    }
  )
})

await test('checkTrace uses simplify candidates to reduce individual operations', async () => {
  const run = (ops: readonly number[]) => {
    if (ops.some(op => op >= 10)) {
      throw new Error('big')
    }
  }
  await assert.rejects(
    Testing.checkTrace({
      seed: 5,
      trials: 20,
      fixed: true,
      length: 10,
      op: rng => rng.int(100),
      run,
      simplify: op => op > 0 ? [ Math.floor(op / 2), op - 1 ] : []
    }),
    (error: unknown) => error instanceof Testing.TraceError && error.ops.length === 1 && error.ops[0] === 10
  )
})

await test('the same seed reproduces the same failing trace', async () => {
  const options = {
    seed: 99,
    trials: 10,
    fixed: true,
    length: 20,
    op: (rng: Testing.Prng) => rng.int(4),
    run: (ops: readonly number[]) => { if (ops.filter(op => op === 3).length >= 3) { throw new Error('three 3s') } }
  }
  const [ a, b ] = await Promise.all([ 0, 1 ].map(() => Testing.checkTrace(options).then(() => undefined, (error: unknown) => error as Testing.TraceError)))
  assert.ok(a && b)
  assert.deepEqual(a.ops, b.ops)
  assert.equal(a.trial, b.trial)
})

await test('stressFactor reads SLOW_TESTS', () => {
  const previous = process.env.SLOW_TESTS
  try {
    delete process.env.SLOW_TESTS
    assert.equal(Testing.stressFactor(), 1)
    process.env.SLOW_TESTS = 'true'
    assert.equal(Testing.stressFactor(), 20)
    process.env.SLOW_TESTS = '7'
    assert.equal(Testing.stressFactor(), 7)
  } finally {
    if (previous === undefined) {
      delete process.env.SLOW_TESTS
    } else {
      process.env.SLOW_TESTS = previous
    }
  }
})
