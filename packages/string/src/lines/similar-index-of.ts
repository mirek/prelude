import distanceAt from './distance-at.js'

/**
 * Finds most similar index in source lines for search lines.
 * @param sourceLines Source lines to search in.
 * @param searchLines Lines to search for.
 * @returns Start index of most similar match
 */
export function similarIndexOf(sourceLines: string[], searchLines: string[]): number {
  let bestDistance = Infinity
  let index = -1

  // A search longer than the source can still best match at index 0 (missing lines count as empty).
  const n = Math.max(1, sourceLines.length - searchLines.length + 1)
  for (let i = 0; i < n; i++) {
    let distance = distanceAt(sourceLines, i, searchLines)
    if (distance < bestDistance) {
      bestDistance = distance
      index = i
    }
  }

  return index
}

export default similarIndexOf
