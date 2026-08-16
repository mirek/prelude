/**
 * Creates a Generator proxy from an Iterator by adding the Symbol.iterator property.
 * This allows any Iterator to be used where a Generator is expected.
 *
 * @template T - Type of elements in the iterator
 * @param values - The Iterator to wrap as a Generator
 * @returns A Generator proxy for the input iterator
 *
 * @example
 * // Convert a Map iterator to a Generator
 * const map = new Map([['a', 1], ['b', 2], ['c', 3]])
 * const gen = generator(map.entries())
 * const entriesArray = [...gen]
 * // Result: [['a', 1], ['b', 2], ['c', 3]]
 *
 * @example
 * // Make a custom iterator work as a Generator
 * const iter = {
 *   value: 0,
 *   next() {
 *     return this.value < 5
 *       ? { value: this.value++, done: false }
 *       : { value: undefined, done: true }
 *   }
 * }
 * const gen = generator(iter)
 * const values = [...gen]
 * // Result: [0, 1, 2, 3, 4]
 */
// %IteratorPrototype%: gives the wrapper `Symbol.iterator` and the iterator helpers
// (`map`, `take`, ...) that a real generator inherits.
const iteratorPrototype: object =
  Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()))

export const generator =
  <T>(values: Iterator<T>): Generator<T> => {
    // A real generator stays finished once `return()`/`throw()` completed it; remember that for
    // plain iterators, which otherwise keep yielding after a synthesized (or their own) `return`.
    let closed = false
    // A plain wrapper rather than a Proxy over `values`: proxy invariants forbid returning a bound
    // `next` for frozen / non-configurable iterators, yet native iterator methods need the real
    // iterator as `this`, so forward each call explicitly.
    const wrapper = {
      __proto__: iteratorPrototype,
      next: (...args: [] | [unknown]) => closed ?
        { done: true, value: undefined } :
        values.next(...args),
      return: (value?: unknown) => {
        // A completed generator stays completed: do not re-enter the source.
        if (closed || values.return === undefined) {
          closed = true
          return { done: true, value }
        }
        try {
          const result = values.return(value)
          closed ||= result.done === true
          return result
        } catch (error) {
          closed = true
          throw error
        }
      },
      throw: (error?: unknown) => {
        // A completed generator rethrows without re-entering the source.
        if (closed || values.throw === undefined) {
          closed = true
          throw error
        }
        try {
          const result = values.throw(error)
          closed ||= result.done === true
          return result
        } catch (thrown) {
          closed = true
          throw thrown
        }
      }
    }
    return wrapper as unknown as Generator<T>
  }

export default generator
