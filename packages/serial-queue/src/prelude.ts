
export type Entry<Args, R> = {
  args: Args,
  resolve: (value: R | PromiseLike<R>) => void,
  reject: (err: unknown) => void
}

export type SerialQueue<Args extends unknown[], R> = {
  f: (...args: Args) => Promise<R>,
  entries: Entry<Args, R>[],
  drained?: () => void,
  /** Entry whose `f` is currently in flight, if any. */
  running?: Entry<Args, R>
}
