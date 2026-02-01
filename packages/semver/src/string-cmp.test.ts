import * as Semver from './index.js'

test('cmp', () => {
  expect(Semver.stringCmp('1.0.0', '1.0.0')).toBe(0)
  expect(Semver.stringCmp('1.0.0', '1.0.1')).toBe(-1)
  expect(Semver.stringCmp('1.0.1', '1.0.0')).toBe(1)
})
