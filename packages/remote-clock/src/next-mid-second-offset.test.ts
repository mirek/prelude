import * as RemoteClock from './index.js'

const t =
  (value: string) =>
    RemoteClock.nextMidSecondOffset(RemoteClock.of(), new Date(value).getTime())

test('simple', () => {
  expect(t('2000-01-01T00:00:00.000Z')).toEqual(500)
  expect(t('2000-01-01T00:00:00.250Z')).toEqual(250)
  expect(t('2000-01-01T00:00:00.500Z')).toEqual(1000)
  expect(t('2000-01-01T00:00:00.750Z')).toEqual(750)
  expect(t('2000-01-01T00:00:00.123Z')).toEqual(500 - 123)
})
