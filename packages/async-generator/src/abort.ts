import type * as Ch from '@prelude/channel'

/**
 * Wires `signal` to a concurrent transform: aborting fails `output` with
 * `signal.reason` (the consumer's `for await` throws it at once) and closes
 * `input`, which stops the workers from pulling more; work already in flight
 * in `f` is left to settle on its own and its result is dropped.
 *
 * @returns cleanup that detaches from the signal; call it once the transform is done.
 */
export const abortConcurrent =
  (signal: undefined | AbortSignal, input: Pick<Ch.Channel<unknown>, 'doneWriting' | 'close'>, output: Pick<Ch.Channel<unknown>, 'fail'>): () => void => {
    if (!signal) {
      return () => {}
    }
    const onAbort =
      () => {
        output.fail(signal.reason)
        if (!input.doneWriting) {
          input.close(signal.reason)
        }
      }
    if (signal.aborted) {
      onAbort()
      return () => {}
    }
    signal.addEventListener('abort', onAbort, { once: true })
    return () => signal.removeEventListener('abort', onAbort)
  }

export default abortConcurrent
