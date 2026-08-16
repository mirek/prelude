import isBlank from './is-blank.js'
import * as Lines from './lines.js'

/**
 * Removes common leading whitespace from each line of a multiline string.
 * Also removes blank lines from the beginning and end of the string.
 * @param value The multiline string to dedent
 * @returns A new string with common indentation removed
 * @example
 * dedent(`
 *   hello
 *   world
 * `) // 'hello\nworld'
 */
export function dedent(value: string): string {
  const all = Lines.of(value)
  // Remove every blank line at the beginning and end, as documented. Find the
  // bounds first and slice once so many blank lines stay linear.
  let start = 0
  while (start < all.length && isBlank(all[start])) {
    start++
  }
  let end = all.length
  while (end > start && isBlank(all[end - 1])) {
    end--
  }
  const lines = all.slice(start, end)
  let n = Infinity
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      if (line[i] !== ' ' && line[i] !== '\t') {
        n = Math.min(n, i)
        break
      }
    }
  }
  return n === Infinity ? lines.join('\n') : lines.map(_ => _.slice(n)).join('\n')
}

export default dedent
