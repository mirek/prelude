import swap from './swap.js'
import zeroes from './zeroes.js'

/**
 * Based on [Permutation Generation Methods, Robert Sedgewick](http://homepage.math.uiowa.edu/~goodman/22m150.dir/2007/Permutation%20Generation%20Methods.pdf).
 * @returns permutations of an array; the input array is not modified.
 */
export const permutations =
  function* <T>(input: T[]): Generator<T[]> {
    // Permute a private copy so the caller's array is left untouched.
    const values = input.slice()
    const n = values.length
    const c = zeroes(n)
    let i = 1
    let k = 0
    yield values.slice()
    while (i < n) {
      if (c[i] < i) {
        k = (i & 1) === 1 ? c[i] : 0
        swap(values, i, k)
        ++c[i]
        i = 1
        yield values.slice()
      } else {
        c[i++] = 0
      }
    }
  }

export default permutations
