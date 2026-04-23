import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a `boolean`. */
const boolean_: Assert<boolean> =
  value => {
    if (typeof value === 'boolean') {
      return value
    }
    throw new AssertionError({ expected: 'a boolean', received: value })
  }

export default boolean_
