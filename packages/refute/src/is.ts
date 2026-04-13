import { ok, fail, type Refute } from './index.js'

/**  */
const is =
  <T>(a: T): Refute<T> =>
    (value: unknown) =>
      Object.is(value, a) ?
        ok(value as T) :
        fail(value, `expected ${String(a)}`)

export default is
