import * as Encoder from '../encoder.js'
import * as Decoder from '../decoder.js'
import { isTagLike } from './object.js'

export type t = Map<unknown, unknown>

export const constructor = Map

export const name = 'Map'

/**
 * String-keyed maps are encoded as objects; maps with any non-string key are encoded as an
 * array of `[key, value]` pairs so key types survive (`Object.fromEntries` would stringify them).
 */
export const encode =
  (value: t, encoder: Encoder.t) => {
    for (const key of value.keys()) {
      // Non-string keys, and string keys that would be mistaken for encoded values, need the pair form.
      if (typeof key !== 'string' || isTagLike(key)) {
        return { ['^Map$']: Encoder.encode(Array.from(value), encoder) }
      }
    }
    return { ['^Map$']: Encoder.encode(Object.fromEntries(value), encoder) }
  }

export const decode =
  (value: unknown, decoder: Decoder.t): t => {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`Expected array or object, got ${typeof value}.`)
    }
    if (Array.isArray(value)) {
      const entries = Decoder.decode(value, decoder) as unknown[]
      return new Map(entries.map(entry => {
        if (!Array.isArray(entry) || entry.length !== 2) {
          throw new Error('Expected [key, value] entry.')
        }
        return [ entry[0], entry[1] ]
      }))
    }
    return new Map(Object.entries(Decoder.decode(value, decoder) as object))
  }
