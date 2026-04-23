import { AssertionError, type Assert } from './prelude.js'

/** Wraps an `Assert<T>` into a type-guard predicate. */
const predicate =
  <T>(a: Assert<T>) =>
    (value: unknown): value is T => {
      try {
        a(value)
        return true
      } catch (err) {
        if (err instanceof AssertionError) {
          return false
        }
        throw err
      }
    }

export default predicate
