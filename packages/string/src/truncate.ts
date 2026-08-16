/**
 * Truncates a string to the specified length and adds a suffix if truncated.
 *
 * Length is measured in code points, so astral characters (emoji, rare CJK) are never
 * cut in half, which would leave a lone surrogate. Only the retained prefix is walked, so
 * truncating a very large string to a small length costs O(length), not O(input length).
 *
 * @param str - The string to truncate
 * @param length - Maximum length of the truncated string including the suffix
 * @param suffix - The suffix to add to truncated strings (default: '...')
 * @returns The truncated string with suffix if needed
 */
export default function truncate(str: string, length: number, suffix: string = '...'): string {
  // A fractional length keeps whole code points, as `slice` did before the streaming rewrite.
  length = Math.floor(length)
  // UTF-16 length is an upper bound of the code-point count.
  if (str.length <= length) {
    return str
  }

  const suffixLength = Array.from(suffix).length
  const keep = Math.max(0, length - suffixLength)
  let count = 0
  let end = 0
  let keptEnd = 0
  for (const char of str) {
    if (count === keep) {
      keptEnd = end
    }
    count += 1
    end += char.length
    if (count > length) {
      return str.slice(0, keptEnd).trimEnd() + suffix
    }
  }
  return str
}

export { truncate }
