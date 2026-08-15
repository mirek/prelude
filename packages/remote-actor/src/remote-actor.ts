import { ActorError } from '@prelude/actor'
import type { AskOptions, Ref } from '@prelude/actor'
import RemoteError from './error.js'
import type { Frame, RemoteOptions, Transport } from './prelude.js'
import { isFrame } from './prelude.js'

interface Pending {
  readonly resolve: (value: unknown) => void
  readonly reject: (reason: unknown) => void
}

/**
 * A {@link Ref} to an actor served on the other side of a {@link Transport}.
 * `send` and `ask` behave like their local counterparts; a handler error on
 * the remote side rejects `ask` with a {@link RemoteError}.
 */
export class RemoteActor<M, R = void> implements Ref<M, R> {

  readonly name?: string

  readonly #transport: Transport
  readonly #pending = new Map<number, Pending>()
  #unsubscribe: (() => void) | undefined
  #nextId = 1
  #closed = false
  #closeReason: unknown

  constructor(transport: Transport, options: RemoteOptions = {}) {
    this.name = options.name
    this.#transport = transport
    this.#unsubscribe = transport.subscribe(frame => this.#receive(frame))
  }

  /** Number of asks awaiting a reply. */
  get pending(): number {
    return this.#pending.size
  }

  get closed(): boolean {
    return this.#closed
  }

  /** Posts a message. Resolves once the transport has accepted it; delivery is not acknowledged. */
  async send(message: M): Promise<void> {
    if (this.#closed) {
      throw this.#closeReason
    }
    await this.#transport.post({ type: 'send', message })
  }

  /** Posts a message and resolves with the remote handler's reply. */
  ask(message: M, options: AskOptions = {}): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      if (this.#closed) {
        reject(this.#closeReason)
        return
      }
      const id = this.#nextId++
      const cleanups: (() => void)[] = []
      const settle =
        (f: () => void) => {
          if (!this.#pending.delete(id)) {
            return
          }
          for (const cleanup of cleanups) {
            cleanup()
          }
          f()
        }
      this.#pending.set(id, {
        resolve: value => settle(() => resolve(value as R)),
        reject: reason => settle(() => reject(reason))
      })

      if (options.timeout !== undefined) {
        const timer = setTimeout(
          () => this.#pending.get(id)?.reject(new ActorError(`Ask timed out after ${options.timeout}ms.`, 'timeout')),
          options.timeout
        )
        cleanups.push(() => clearTimeout(timer))
      }

      const signal = options.signal
      if (signal) {
        if (signal.aborted) {
          this.#pending.get(id)?.reject(signal.reason)
          return
        }
        const onAbort = () => this.#pending.get(id)?.reject(signal.reason)
        signal.addEventListener('abort', onAbort, { once: true })
        cleanups.push(() => signal.removeEventListener('abort', onAbort))
      }

      // Post synchronously so asks and sends stay in issue order.
      try {
        Promise
          .resolve(this.#transport.post({ type: 'ask', id, message }))
          .catch((error: unknown) => this.#pending.get(id)?.reject(error))
      } catch (error) {
        this.#pending.get(id)?.reject(error)
      }
    })
  }

  /** Stops listening and rejects every pending ask with a {@link RemoteError} (`code: 'closed'`). */
  close(reason: unknown = new RemoteError('Remote actor closed.', 'closed')): void {
    if (this.#closed) {
      return
    }
    this.#closed = true
    this.#closeReason = reason
    this.#unsubscribe?.()
    this.#unsubscribe = undefined
    for (const pending of this.#pending.values()) {
      pending.reject(reason)
    }
  }

  #receive(frame: Frame): void {
    if (!isFrame(frame)) {
      return
    }
    if (frame.type === 'reply') {
      this.#pending.get(frame.id)?.resolve(frame.value)
    } else if (frame.type === 'error') {
      this.#pending.get(frame.id)?.reject(new RemoteError(frame.error.message, 'remote', frame.error))
    }
  }

}

export default RemoteActor
