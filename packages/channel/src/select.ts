import { Channel, ReadAttempt, WriteAttempt, Attempt, Attempted, Thunk } from './channel.js'

/**
 * Selects from multiple attempts asynchronously.
 * @typeparam Attempts - Tuple of attempt types.
 * @param attempts - Variadic attempts to select from.
 * @returns An async generator that yields selected values.
 */
export async function* select<Attempts extends Attempt[]>(
  ...attempts: Attempts
): AsyncGenerator<Attempted<Attempts[number]>> {
  while (true) {
    const result = await selectNext(...attempts)
    if (result.done) {
      break
    }
    yield result.value
  }
}

/**
 * Performs a single selection attempt.
 * @typeparam Attempts - Tuple of attempt types.
 * @param attempts - Variadic attempts to select from.
 * @returns A promise that resolves with the selected value or error.
 */
/**
 * Performs an asynchronous selection.
 * @typeparam Attempts - Tuple of attempt types.
 * @param attempts - Variadic attempts to select from.
 * @returns A promise that resolves with the selected value or error.
 */
export async function selectNext<Attempts extends Attempt[]>(
  ...attempts: Attempts
): Promise<IteratorResult<Attempted<Attempts[number]>>> {
  return selectSync(attempts) ?? await selectAsync(attempts)
}

export function selectAsync<Attempts extends Attempt[]>(
  attempts: Attempts
): Promise<IteratorResult<Attempted<Attempts[number]>>> {
  return new Promise((resolve, reject) => {
    const undos: Thunk[] = []
    for (const attempt of attempts) {
      if (attempt instanceof Channel) {
        undos.push(attempt.pushRead(result => {
          undos.forEach(undo => undo())
          if (result.done && attempt.failed) {
            // A failed channel rejects its readers; select is a reader too.
            reject(attempt.error)
            return
          }
          resolve(result as IteratorResult<Attempted<Attempts[number]>>)
        }))
      } else if (attempt instanceof WriteAttempt) {
        const own = undos.length
        undos.push(attempt.channel.pushWrite({ value: attempt.value, enqueued: (err: unknown) => {
          // Cancel the other attempts only: this write has just been accepted (it may still sit in
          // the buffer of a bounded channel) and undoing it would remove the delivered value.
          undos.forEach((undo, index) => {
            if (index !== own) {
              undo()
            }
          })
          if (err) {
            reject(err)
            return
          }
          resolve(attempt.perform(attempt.value) as IteratorResult<Attempted<Attempts[number]>>)
        }}))
      } else if (attempt instanceof ReadAttempt) {
        undos.push(attempt.channel.pushRead(result => {
          undos.forEach(undo => undo())
          if (result.done && attempt.channel.failed) {
            reject(attempt.channel.error)
            return
          }
          resolve(attempt.perform(result) as IteratorResult<Attempted<Attempts[number]>>)
        }))
      } else {
/**
 * Performs a synchronous selection attempt.
 * @typeparam Attempts - Tuple of attempt types.
 * @param attempts - Variadic attempts to select from.
 * @returns The selected value or undefined if no immediate selection possible.
 */
        throw new Error('Invalid attempt.')
      }
    }
  })
}

export function selectSync<Attempts extends Attempt[]>(
  attempts: Attempts
): undefined | IteratorResult<Attempted<Attempts[number]>> {
  const n = attempts.length
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (n - i))
    const attempt = attempts[j] as Attempts[number]
    if (attempt instanceof Channel) {
      if (attempt.pendingWrites > 0) {
        return { done: false, value: attempt.consumeWrite() }
      }
      if (attempt.failed) {
        // Same contract as `next()`/`read()`: a failed channel rejects (selectNext is async).
        throw attempt.error
      }
      if (attempt.done) {
        // A completed channel completes the selection; a read pushed on it
        // asynchronously would never settle.
        return { done: true, value: undefined }
      }
    } else if (attempt instanceof WriteAttempt) {
      if (attempt.channel.doneWriting) {
        // Same contract as `write()`: writing to a closed channel fails instead of
        // silently buffering (or, for unbuffered channels, never settling).
        throw new Error('Channel closed.')
      }
      if (attempt.channel.pendingReads > 0) {
        // A waiting reader takes the value directly, whatever the capacity.
        attempt.channel.consumeRead({ done: false, value: attempt.value })
        return attempt.perform(attempt.value)
      } else if (attempt.channel.pendingWrites < attempt.channel.cap) {
        attempt.channel.pushWrite({ value: attempt.value })
        return attempt.perform(attempt.value)
      }
    } else if (attempt instanceof ReadAttempt) {
      if (attempt.channel.pendingWrites > 0) {
        const value = attempt.channel.consumeWrite()
        return attempt.perform({ done: false, value })
      }
      if (attempt.channel.failed) {
        throw attempt.channel.error
      }
      if (attempt.channel.done) {
        return attempt.perform({ done: true, value: undefined })
      }
    } else {
      throw new Error('Invalid attempt.')
    }
    attempts[j] = attempts[i]
    attempts[i] = attempt
  }
  return
}
