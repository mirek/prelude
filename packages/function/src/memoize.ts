/**
 * Identity registry for values keyed by identity. Objects, functions and non-registered symbols
 * are held weakly so a value forgotten by every caller is not retained here forever; registered
 * symbols (`Symbol.for`) cannot be collected and are not valid `WeakMap` keys, so they use a
 * strong `Map`.
 */
const identities = new WeakMap<WeakKey, number>()
const registeredSymbolIdentities = new Map<symbol, number>()
let nextIdentity = 0

const identityOf =
  (value: object | symbol): number => {
    const registry =
      typeof value === 'symbol' && Symbol.keyFor(value) !== undefined ?
        registeredSymbolIdentities :
        identities
    let id = registry.get(value)
    if (id === undefined) {
      id = nextIdentity++
      registry.set(value, id)
    }
    return id
  }

/** A NUL prefix cannot come from ordinary JSON output, so it marks tagged values in keys. */
const tag = String.fromCharCode(0)

/**
 * Literal strings that happen to start with NUL are escaped with this prefix so they can never
 * collide with a generated tag (no tag starts with `\0:`).
 */
const escape = `${tag}:`

/**
 * Default cache key: `JSON.stringify` of the arguments, except that values JSON cannot
 * represent are tagged so they do not collapse into `null` (or throw): `undefined`, `NaN`,
 * `±Infinity`, bigints, and functions/symbols (keyed by identity). Literal strings starting with
 * NUL are escaped so they stay distinct from those tags; other strings are kept as-is.
 */
export const key =
  (args: unknown[]): string =>
    JSON.stringify(args, (_, value: unknown) => {
      // JSON unwraps boxed primitives after the replacer ran, so unwrap first: a boxed string
      // must be escaped like a primitive one, or it could spell out an escaped/tagged key.
      if (value instanceof String || value instanceof Number || value instanceof Boolean) {
        value = value.valueOf()
      }
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
        case 'string':
          return value.startsWith(tag) ? `${escape}${value}` : value
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
