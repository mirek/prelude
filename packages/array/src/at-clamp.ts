import at from './at.js'

/** Like `at` but bounds less than zero index to 0 and out of bound to last. */
export const atClamp =
  <T>(values: T[], index: number): T => {
    if (values.length === 0) {
      throw new Error('Expected non empty array.')
    }
    return at(values, Math.min(values.length - 1, Math.max(0, index)))
  }

export default atClamp
