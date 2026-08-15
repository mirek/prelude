import { AssertionError, type Assert, type Primitive } from './prelude.js'

/** Asserts `value` is an array of unique elements (optionally keyed by `f`). */
const unique =
  <T>(a: Assert<T>, f?: (value: T) => Primitive): Assert<T[]> =>
    value => {
      if (!Array.isArray(value)) {
        throw new AssertionError({ expected: 'an array', value })
      }
      const seen = new Set<Primitive>()
      for (let i = 0; i < value.length; i++) {
        let v: T
        try {
          v = a(value[i])
        } catch (err) {
          if (err instanceof AssertionError) {
            throw new AssertionError({
              expected: err.expected,
              value: err.value,
              key: i,
              cause: err
            })
          }
          throw err
        }
        const key = f ? f(v) : (v as unknown as Primitive)
        if (seen.has(key)) {
          throw new AssertionError({
            expected: 'a unique value',
            value: value[i],
            key: i
          })
        }
        seen.add(key)
      }
      return value as T[]
    }

export default unique
