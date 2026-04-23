import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is a `symbol`. */
const symbol_: Assert<symbol> =
  value => {
    if (typeof value === 'symbol') {
      return value
    }
    throw new AssertionError({ expected: 'a symbol', received: value })
  }

export default symbol_
