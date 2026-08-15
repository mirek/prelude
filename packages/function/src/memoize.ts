const identities = new WeakMap<object, number>()
const symbolIdentities = new Map<symbol, number>()
let nextIdentity = 0

const identityOf =
  (value: object | symbol): number => {
    if (typeof value === 'symbol') {
      let id = symbolIdentities.get(value)
      if (id === undefined) {
        id = nextIdentity++
        symbolIdentities.set(value, id)
      }
      return id
    }
    let id = identities.get(value)
    if (id === undefined) {
      id = nextIdentity++
      identities.set(value, id)
    }
    return id
  }

/** A NUL prefix cannot come from ordinary JSON output, so it marks tagged values in keys. */
const tag = String.fromCharCode(0)

/**
 * Default cache key: `JSON.stringify` of the arguments, except that values JSON cannot
 * represent are tagged so they do not collapse into `null` (or throw): `undefined`, `NaN`,
 * `±Infinity`, bigints, and functions/symbols (keyed by identity).
 */
export const key =
  (args: unknown[]): string =>
    JSON.stringify(args, (_, value: unknown) => {
      switch (typeof value) {
        case 'undefined':
          return `${tag}undefined`
        case 'bigint':
          return `${tag}${value}n`
        case 'number':
          return Number.isFinite(value) ? value : `${tag}${value}`
        case 'function':
          return `${tag}function#${identityOf(value)}`
        case 'symbol':
          return `${tag}symbol#${identityOf(value)}`
        default:
          return value
      }
    })

const memoize =
  <Args extends unknown[], R>(f: (...args: Args) => R, k: (args: Args) => string = key) => {
    const cache = new Map<string, R>()
    const f_ =
      (...args: Args) => {
        const key_ = k(args)
        if (cache.has(key_)) {
          return cache.get(key_) as R
        }
        const r = f(...args)
        cache.set(key_, r)
        return r
      }
    f_.cache = cache
    return f_
  }

export default memoize
