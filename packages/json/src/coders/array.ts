import * as Encoder from '../encoder.js'
import * as Decoder from '../decoder.js'
import { ancestors } from './object.js'

export type t = unknown[]
export const constructor = Array
export const name = 'Array'

export const encode =
  (input: t, encoder: Encoder.t) => {
    if (ancestors.has(input)) {
      throw new TypeError('Converting circular structure to JSON.')
    }
    ancestors.add(input)
    try {
      let output: unknown[] = input
      const n = input.length
      for (let i = 0; i < n; i++) {
        const inputValue = input[i]
        const value = Encoder.encode(inputValue, encoder)
        if (inputValue === value) {
          continue
        }
        if (output === input) {
          output = input.slice()
        }
        output[i] = value
      }
      return output
    } finally {
      ancestors.delete(input)
    }
  }

export const decode =
  (mutableInput: unknown, decoder: Decoder.t): t => {
    if (!Array.isArray(mutableInput)) {
      throw new Error(`Expected array, got ${typeof mutableInput}.`)
    }
    const n = mutableInput.length
    for (let i = 0; i < n; i++) {
      mutableInput[i] = Decoder.decode(mutableInput[i], decoder)
    }
    return mutableInput
  }
