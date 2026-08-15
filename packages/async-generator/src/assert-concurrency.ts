/**
 * Validates a `concurrency` option: worker pools need a positive integer number of workers
 * (`Infinity` cannot size a pool and `0` or negatives would silently process nothing).
 * @internal
 */
export function assertConcurrency(concurrency: number): void {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new RangeError(`Expected concurrency to be a positive integer, got ${concurrency}.`)
  }
}

export default assertConcurrency
