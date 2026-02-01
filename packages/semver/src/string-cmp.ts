import * as Cmp from '@prelude/cmp'
import cmp from './cmp.js'
import parse from './parse.js'

/** Semver string comparision function. */
export const stringCmp =
  Cmp.map(cmp, parse)

export default stringCmp
