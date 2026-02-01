import * as Semver from './index.js'

test('simple', () => {
  expect([
    '1.0.0-alpha.beta',
    '1.0.0',
    'v2.0.1',
    '1.0.0-alpha',
    '1.1.0',
    '1.0.0-beta',
    '1.0.0-alpha.1',
    'v2.0.0'
  ].sort(Semver.stringDsc)).toEqual([
    'v2.0.1',
    'v2.0.0',
    '1.1.0',
    '1.0.0-beta',
    '1.0.0-alpha.beta',
    '1.0.0-alpha.1',
    '1.0.0-alpha',
    '1.0.0'
  ])
})
