/** Shared test helpers (not part of the published API). */
import * as Actor from '@prelude/actor'

export interface Deferred<T> {
  readonly promise: Promise<T>
  readonly resolve: (value: T | PromiseLike<T>) => void
  readonly reject: (reason?: unknown) => void
}

export function deferred<T = void>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })
  return { promise, resolve, reject }
}

/** Yields to the microtask queue a few times so promise chains settle. */
export async function tick(times = 10): Promise<void> {
  for (let i = 0; i < times; i++) {
    await Promise.resolve()
  }
}

/** A manual clock for deterministic restart windows. */
export function clock(start = 0) {
  let now = start
  return {
    now: () => now,
    advance(milliseconds: number) {
      now += milliseconds
    }
  }
}

export interface WorkerState {
  generation: number
  seen: string[]
}

/** Actor options for a worker that throws on messages starting with `boom`. */
export function worker(name: string): Actor.Options<string, WorkerState, number> {
  let inits = 0
  return {
    name,
    init: () => ({ generation: inits++, seen: [] }),
    receive: (message, state) => {
      if (message.startsWith('boom')) {
        throw new Error(`${name}: ${message}`)
      }
      state.seen.push(message)
      return state.seen.length
    }
  }
}
