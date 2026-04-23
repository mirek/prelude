import { AssertionError, type Assert } from './prelude.js'

/** Asserts `value` is an object whose keys satisfy `k` and values satisfy `v`. */
const record =
  <K extends string | symbol | number, V>(k: Assert<K>, v: Assert<V>): Assert<Record<K, V>> =>
    value => {
      if (typeof value !== 'object' || value === null) {
        throw new AssertionError({ expected: 'an object', received: value })
      }
      for (const k_ in value) {
        try {
          k(k_)
        } catch (err) {
          if (err instanceof AssertionError) {
            throw new AssertionError({
              expected: err.expected,
              received: err.received,
              key: k_,
              cause: err
            })
          }
          throw err
        }
        try {
          v((value as Record<string, unknown>)[k_])
        } catch (err) {
          if (err instanceof AssertionError) {
            throw new AssertionError({
              expected: err.expected,
              received: err.received,
              key: k_,
              cause: err
            })
          }
          throw err
        }
      }
      return value as Record<K, V>
    }

export default record
