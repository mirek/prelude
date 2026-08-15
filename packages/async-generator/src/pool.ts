import * as Ch from '@prelude/channel'

/**
 * Runs `concurrency` workers that drain `input` through `work`.
 *
 * Closes `output` for writing once every worker has finished. If a worker (or the
 * input channel) fails, closes `input` so remaining workers stop and fails `output`
 * with the error, so the consumer of `output` sees it instead of a silent completion.
 *
 * @internal
 */
export function pool<T, R>(
  input: Ch.Channel<T>,
  output: Ch.Channel<R>,
  concurrency: number,
  work: (value: T, worker: number) => Promise<void>
): void {
  const workers = Array.from({ length: concurrency }, async (_, worker) => {
    for await (const value of input) {
      await work(value, worker)
    }
  })
  Promise
    .all(workers)
    .then(() => {
      if (!output.doneWriting) {
        output.closeWriting()
      }
    }, err => {
      if (input.failed) {
        // The source failed: values already handed to workers are still legitimate results
        // (as with serial processing), so let in-flight work deliver before failing the output.
        void Promise.allSettled(workers).then(() => output.fail(input.error))
        return
      }
      // A worker failed: stop the others and fail fast.
      if (!input.doneWriting) {
        input.close(err)
      }
      output.fail(err)
    })
}

export default pool
