import * as Constructor from './constructor.js'

export type t = {
  encoders: Map<{ name: string }, (value: unknown, encoder: t) => unknown>
  stringify: (value: unknown, replacer?: (this: unknown, key: string, value_: unknown) => unknown, space?: number | string) => string
}

export type Encode<T = unknown> =
  (value: T, encoder: t) =>
    unknown

/** Objects currently being encoded (encoding is synchronous), to report cycles instead of overflowing the stack. */
const ancestors = new Set<object>()

export function encode(value: unknown, encoder: t) {
  const constructor = Constructor.of(value)
  const encodeValue = encoder.encoders.get(constructor)
  if (!encodeValue) {
    return value
  }
  if (typeof value !== 'object' || value === null) {
    return encodeValue(value, encoder)
  }
  // Tracked here, at the common dispatch, so every recursive coder (Object, Array, Set, Map, Error, ...) is covered.
  if (ancestors.has(value)) {
    throw new TypeError('Converting circular structure to JSON.')
  }
  ancestors.add(value)
  try {
    return encodeValue(value, encoder)
  } finally {
    ancestors.delete(value)
  }
}

export const stringify =
  (value: unknown, encoder: t) =>
    JSON.stringify(encode(value, encoder))
