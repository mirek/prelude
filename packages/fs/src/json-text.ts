type Replacer =
  Parameters<typeof JSON.stringify>[1]

type Space =
  Parameters<typeof JSON.stringify>[2]

/**
 * `JSON.stringify` that never yields the string `undefined`: a value JSON cannot represent
 * (`undefined`, a function, a symbol) would otherwise be written as the literal text
 * `undefined`, which no reader can parse.
 */
export const jsonText =
  (value: unknown, replacer: Replacer = null, space?: Space): string => {
    const text = JSON.stringify(value, replacer, space)
    if (text === undefined) {
      throw new TypeError(`Cannot write ${typeof value} as JSON.`)
    }
    return text
  }

export default jsonText
