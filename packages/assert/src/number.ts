import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a `number`. */
const number_: Assert<number> =
  value => {
    if (typeof value === 'number') {
      return value
    }
    throw new AssertionError({ expected: 'a number', received: value })
  }

export default number_
