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
