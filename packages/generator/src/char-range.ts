/**
 * Creates a generator that yields all characters between two specified characters (inclusive).
 *
 * @param firstChar - The starting character of the range
 * @param lastChar - The ending character of the range
 * @yields Each character in the range, from firstChar to lastChar
 *
 * @example
 * // Generate all lowercase letters from 'a' to 'e'
 * const letters = [...charRange('a', 'e')]
 * // Result: ['a', 'b', 'c', 'd', 'e']
 *
 * @example
 * // Generate digits from '0' to '9'
 * const digits = [...charRange('0', '9')]
 * // Result: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
 */
export const charRange =
  function* (firstChar: string, lastChar: string): Generator<string> {
    // Code points rather than code units, so astral ranges (emoji) yield whole characters.
    const firstCodePoint = firstChar.codePointAt(0) as number
    const lastCodePoint = lastChar.codePointAt(0) as number
    for (let codePoint = firstCodePoint; codePoint <= lastCodePoint; codePoint++) {
      yield String.fromCodePoint(codePoint)
    }
  }

export default charRange
