
export type Entry<Args, R> = {
  args: Args,
  resolve: (value: R | PromiseLike<R>) => void,
  reject: (err: unknown) => void
}

export type SerialQueue<Args extends unknown[], R> = {
  f: (...args: Args) => Promise<R>,
  entries: Entry<Args, R>[],
  /**
   * Called after the last entry settled (or after `rejectAll`). Errors thrown
   * by the hook are rethrown asynchronously as uncaught exceptions; they never
   * affect the entries or the queue.
   */
  drained?: () => void,
  /** Entry whose `f` is currently in flight, if any. */
  running?: Entry<Args, R>
}
