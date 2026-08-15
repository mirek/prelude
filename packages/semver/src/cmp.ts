import type { Semver } from './prelude.js'

function numberCmp(a: number, b: number) {
  return a === b ? 0 : a < b ? -1 : 1
}

function numericIdentifierCmp(a: string, b: string) {
  if (a.length !== b.length) {
    return numberCmp(a.length, b.length)
  }
  return a === b ? 0 : a < b ? -1 : 1
}

function prereleaseCmp(a?: string, b?: string) {
  if (a === undefined) {
    return b === undefined ? 0 : 1
  }
  if (b === undefined) {
    return -1
  }

  const left = a.split('.')
  const right = b.split('.')
  const length = Math.max(left.length, right.length)

  for (let index = 0; index < length; index += 1) {
    const leftIdentifier = left[index]
    const rightIdentifier = right[index]

    if (leftIdentifier === undefined) {
      return -1
    }
    if (rightIdentifier === undefined) {
      return 1
    }
    if (leftIdentifier === rightIdentifier) {
      continue
    }

    const leftNumeric = /^\d+$/.test(leftIdentifier)
    const rightNumeric = /^\d+$/.test(rightIdentifier)

    if (leftNumeric && rightNumeric) {
      return numericIdentifierCmp(leftIdentifier, rightIdentifier)
    }
    if (leftNumeric) {
      return -1
    }
    if (rightNumeric) {
      return 1
    }
    return leftIdentifier < rightIdentifier ? -1 : 1
  }

  return 0
}

/**
 * Compares parsed versions using SemVer 2.0.0 precedence.
 *
 * Build metadata and the optional parsing date are intentionally ignored.
 */
const cmp = (a: Semver, b: Semver) =>
  numberCmp(a.major, b.major) ||
  numberCmp(a.minor, b.minor) ||
  numberCmp(a.patch, b.patch) ||
  prereleaseCmp(a.prerelease, b.prerelease)

export default cmp
