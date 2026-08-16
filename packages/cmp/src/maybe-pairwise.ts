import { type MaybeCmp, eq, asc, dsc } from './prelude.js'

/**
 * Closes an iterator that is being left before it reported `done`; when an error is already in flight
 * (`failed`) a throwing `return()` is swallowed so it does not mask that error.
 */
const closeIterator =
  (iterator: Iterator<unknown>, failed: boolean) => {
    if (failed) {
      try {
        iterator.return?.()
      } catch {
        // Keep the in-flight error.
      }
    } else {
      iterator.return?.()
    }
  }

/** Pairwise comparision on iterables. */
export const maybePairwise =
  <T>(cmp: MaybeCmp<T>) =>
    (a: Iterable<T>, b: Iterable<T>) => {
      const iteratorA = a[Symbol.iterator]()
      const iteratorB = b[Symbol.iterator]()
      let resultA: IteratorResult<T> | undefined
      let resultB: IteratorResult<T> | undefined
      let failed = false
      try {
        resultA = iteratorA.next()
        resultB = iteratorB.next()
        while (!resultA.done && !resultB.done) {
          const resultCmp = cmp(resultA.value, resultB.value)
          if (resultCmp !== eq) {
            return resultCmp
          }
          resultA = iteratorA.next()
          resultB = iteratorB.next()
        }
        if (resultA.done && resultB.done) {
          return eq
        }
        if (resultA.done) {
          return asc
        }
        return dsc
      } catch (error) {
        failed = true
        throw error
      } finally {
        // Close only the iterators that were left before `done`.
        if (!resultA?.done) {
          closeIterator(iteratorA, failed)
        }
        if (!resultB?.done) {
          closeIterator(iteratorB, failed)
        }
      }
    }

export default maybePairwise
