import * as Ch from '@prelude/channel'

/**
 * Runs `concurrency` workers that drain `input` through `work`.
 *
 * Closes `output` for writing once every worker has finished. If a worker fails, closes
 * `input` so remaining workers stop and fails `output` with the error, so the consumer of
 * `output` sees it instead of a silent completion. If the input channel fails, lets the
 * in-flight work deliver before failing `output` with the input error, unless a worker
 * fails on its own meanwhile, in which case `output` fails with that error right away.
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
        // A worker failing on its own must still fail the output right away: with ordered
        // delivery the other workers wait for its turn and would otherwise never settle.
        void Promise
          .allSettled(workers.map(worker => worker.catch(e => {
            if (e !== input.error) {
              output.fail(e)
            }
          })))
          .then(() => output.fail(input.error))
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
