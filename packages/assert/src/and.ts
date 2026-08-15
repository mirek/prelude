import type { Assert, IntersectionOfUnion, Lifted, Primitive } from './prelude.js'
import lift from './lift.js'

/** Asserts `value` satisfies all provided asserts / primitives. */
const and =
  <Ts extends (Primitive | Assert<unknown>)[]>(...as: Ts): Assert<IntersectionOfUnion<Lifted<Ts[number]>>> => {
    const asserts = as.map(lift)
    return value => {
      for (let i = 0; i < asserts.length; i++) {
        asserts[i]!(value)
      }
      return value as IntersectionOfUnion<Lifted<Ts[number]>>
    }
  }

export default and
