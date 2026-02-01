import * as P from './index.js'

test('42', () => {
  expect(P.pipe(42, String)).toEqual('42')
})
