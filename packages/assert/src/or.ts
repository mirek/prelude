import { AssertionError, type Assert, type Lifted, type Primitive } from './prelude.js'
import lift from './lift.js'

/** Asserts `value` satisfies at least one of the provided asserts / primitives. */
const or =
  <Ts extends (Primitive | Assert<unknown>)[]>(...as: Ts): Assert<Lifted<Ts[number]>> => {
    const asserts = as.map(lift)
    return value => {
      const expecteds: string[] = []
      for (let i = 0; i < asserts.length; i++) {
        try {
          return asserts[i]!(value) as Lifted<Ts[number]>
        } catch (err) {
          if (!(err instanceof AssertionError)) {
            throw err
          }
          expecteds.push(err.expected)
        }
      }
      throw new AssertionError({
        expected: expecteds.join(' or '),
        received: value
      })
    }
  }

export default or
