import * as Cmp from '@prelude/cmp'
import dsc from './dsc.js'
import parse from './parse.js'

/** Descending semver string comparision function. */
export const stringDsc =
  Cmp.map(dsc, parse)

export default stringDsc
