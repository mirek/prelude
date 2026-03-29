import WaitGroup from './index.js'

test('simple', async () => {
  const wg = new WaitGroup(3)
  setTimeout(() => {
    wg.done(3)
  }, 100)
  await expect(wg.wait()).resolves.toBeUndefined()
})

test('rejects', () => {
  const wg = new WaitGroup(3)
  expect(() => wg.done(4)).toThrow('negative counter')
})
