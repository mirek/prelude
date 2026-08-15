import { ok, fail, type Refute } from './prelude.js'

/**
 * Creates a refute function that validates if a value is a string that matches the provided regular expression.
 * @param re - The regular expression to match against
 * @returns A refute function that validates if a value is a string that matches the provided regular expression
 */
const regexp =
  (re: RegExp): Refute<string> =>
    (value: unknown) => {
      if (typeof value !== 'string') {
        return fail(value, 'expected string')
      }
      // A sticky (or global) regexp keeps lastIndex between calls; the refute must be stateless.
      re.lastIndex = 0
      return re.test(value) ?
        ok(value) :
        fail(value, `expected to match ${re}.`)
    }

export default regexp
