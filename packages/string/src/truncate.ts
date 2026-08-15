/**
 * Truncates a string to the specified length and adds a suffix if truncated.
 *
 * Length is measured in code points, so astral characters (emoji, rare CJK) are never
 * cut in half, which would leave a lone surrogate.
 *
 * @param str - The string to truncate
 * @param length - Maximum length of the truncated string including the suffix
 * @param suffix - The suffix to add to truncated strings (default: '...')
 * @returns The truncated string with suffix if needed
 */
export default function truncate(str: string, length: number, suffix: string = '...'): string {
  const chars = Array.from(str)
  if (chars.length <= length) {
    return str
  }

  const truncatedLength = Math.max(0, length - Array.from(suffix).length)
  return chars.slice(0, truncatedLength).join('').trimEnd() + suffix
}

export { truncate }
