import * as F from '@prelude/function'
import parse from './parse.js'

export const maybeParse =
  (semver: unknown, date?: string) =>
    typeof semver === 'string' ?
      F.mute(() => parse(semver, date), undefined) :
      undefined

export default maybeParse
