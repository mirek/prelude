import * as Encoder from '../encoder.js'
import * as Decoder from '../decoder.js'

export type t = Uint8Array

export const constructor = Uint8Array

export const name = 'Uint8Array'

export const encode =
  (value: Uint8Array, _encoder: Encoder.t) => {
    // Spreading the whole array into fromCharCode overflows the stack for large inputs; chunk it.
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < value.length; i += chunk) {
      binary += String.fromCharCode(...value.subarray(i, i + chunk))
    }
    return { '^Uint8Array$': btoa(binary) }
  }

export const decode =
  (value: unknown, _decoder: Decoder.t): t => {
    if (typeof value !== 'string') {
      throw new Error(`Expected string, got ${typeof value}.`)
    }
    const decoded = atob(value)
    const array = new Uint8Array(decoded.length)
    for (let i = 0; i < decoded.length; i++) {
      array[i] = decoded.charCodeAt(i)
    }
    return array
  }
