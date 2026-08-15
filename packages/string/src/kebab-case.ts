/**
 * Converts a string to kebab-case.
 */
export default function kebabCase(str: string): string {
  return str
    .trim()
    .replace(/(\p{Ll})(\p{Lu})/gu, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export { kebabCase }
