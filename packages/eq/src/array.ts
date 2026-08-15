import type { Eq } from './prelude.js'

function array_<T>(eq: Eq<T>) {
  return function (a: T[], b: T[]) {
    if (a.length !== b.length) {
      return false
    }
    // Index loop rather than `every`, which skips holes and so treated [, 1] as equal to [2, 1].
    for (let i = 0; i < a.length; i++) {
      if (!eq(a[i], b[i])) {
        return false
      }
    }
    return true
  }
}

export { array_ as array }
