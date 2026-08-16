import * as Progress from './index.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

await test('percentage', () => {
  assert.equal(Progress.percentage(0), '  0.0%')
  assert.equal(Progress.percentage(1), '100.0%')
})

await test('bar should not round up partial fill to full block', () => {
  // 0.9375 of 1 char = 7.5 eighths — should show ▉ (7/8), not █ (8/8)
  assert.equal(Progress.bar(1, 0.9375), '▉')
  // 100% should be a full block
  assert.equal(Progress.bar(1, 1.0), '█')
  // 0% should be empty
  assert.equal(Progress.bar(1, 0), ' ')
  // 50% of 2 chars = 1 full block + 1 empty
  assert.equal(Progress.bar(2, 0.5), '█ ')
  // 0.46875 of 2 chars = 7.5 eighths — cell 0 should be ▉, cell 1 empty
  assert.equal(Progress.bar(2, 0.46875), '▉ ')
})

await test('update progress should not overwrite target', async () => {
  const p = Progress.of(1)
  p.update({ target: 0.8, progress: 0.3 })
  p.update({ progress: 0.3 })

  const writes: string[] = []
  const original = process.stdout.write.bind(process.stdout)
  process.stdout.write = ((chunk: string) => { writes.push(chunk); return true }) as typeof process.stdout.write

  try {
    p.start(12)
    await new Promise(resolve => setTimeout(resolve, 200))
    p.stop()
  } finally {
    process.stdout.write = original
  }

  const percentages = writes
    .join('')
    .match(/\d+\.\d+%/g)
    ?.map(s => parseFloat(s)) ?? []

  assert.ok(
    percentages.some(p => p > 30.0),
    `Expected progress to move toward target 0.8, but all frames showed: ${percentages.join(', ')}`
  )
})

await test('animation should converge to exact target', async () => {
  const p = Progress.of(1)
  p.update({ target: 1.0, progress: 0.99 })

  const writes: string[] = []
  const original = process.stdout.write.bind(process.stdout)
  process.stdout.write = ((chunk: string) => { writes.push(chunk); return true }) as typeof process.stdout.write

  try {
    p.start(12)
    await new Promise(resolve => setTimeout(resolve, 2000))
    p.stop()
  } finally {
    process.stdout.write = original
  }

  const percentages = writes
    .join('')
    .match(/\d+\.\d+%/g)
    ?.map(s => parseFloat(s)) ?? []

  const last = percentages[percentages.length - 1]
  assert.equal(last, 100.0, `Expected final frame to be 100.0% but got ${last}%`)
})

await test('non-finite or out-of-range progress renders as an empty/full bar instead of garbage', () => {
  assert.equal(Progress.bar(4, NaN), '    ')
  assert.equal(Progress.bar(4, NaN).length, 4)
  assert.equal(Progress.percentage(NaN), '  0.0%')
  assert.equal(Progress.bar(4, 2), '████')
  assert.equal(Progress.percentage(1.5), '100.0%')
  assert.equal(Progress.bar(4, -1), '    ')
  assert.equal(Progress.bar(4, 0.5), '██  ')
})

await test('text() of an unknown worker index is empty', () => {
  const progress = Progress.of(2)
  progress.update({ index: 1, text: 'b' })
  assert.equal(progress.text(1), 'b')
  assert.equal(progress.text(5), '')
})

await test('aborting the start signal stops rendering, and stop is idempotent', async () => {
  const writes: string[] = []
  const original = process.stdout.write.bind(process.stdout)
  process.stdout.write = ((chunk: string) => { writes.push(chunk); return true }) as typeof process.stdout.write
  try {
    const controller = new AbortController()
    const progress = Progress.of(1).start(100, { signal: controller.signal })
    assert.equal(progress.running, true)
    await new Promise(resolve => setTimeout(resolve, 30))
    assert.ok(writes.length > 0, 'renders while running')
    controller.abort()
    assert.equal(progress.running, false)
    const count = writes.length
    await new Promise(resolve => setTimeout(resolve, 30))
    assert.equal(writes.length, count, 'no render after abort')
    progress.stop()
    progress.stop()
    // An already aborted signal starts nothing.
    assert.equal(Progress.of(1).start(100, { signal: AbortSignal.abort() }).running, false)
    // stop() detaches from the signal: a later abort must not touch a restarted progress.
    const c2 = new AbortController()
    const restarted = Progress.of(1).start(100, { signal: c2.signal })
    restarted.stop()
    restarted.start(100)
    c2.abort()
    assert.equal(restarted.running, true)
    restarted.stop()
  } finally {
    process.stdout.write = original
  }
})

await test('a Progress is disposable', () => {
  const original = process.stdout.write.bind(process.stdout)
  process.stdout.write = (() => true) as typeof process.stdout.write
  try {
    const progress = Progress.of(1).start(100)
    assert.equal(progress.running, true)
    progress[Symbol.dispose]()
    assert.equal(progress.running, false)
  } finally {
    process.stdout.write = original
  }
})
