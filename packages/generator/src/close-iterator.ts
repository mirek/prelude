/**
 * Closes a source iterator that is being left before it reported `done`, the way native `for..of` does on early exit.
 * Callers must not close an exhausted iterator: the iteration protocol never calls `return()` after `done`.
 *
 * @param iterator - Iterator to close
 * @param failed - Whether an error is already in flight; if so a throwing `return()` is swallowed so it does not
 *                 mask that error, otherwise it propagates as it would from `for..of`
 */
export const closeIterator =
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

export default closeIterator
