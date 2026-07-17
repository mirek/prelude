import payloadText from './payload.js'
import {
  isErrorResponse,
  isSuccessResponse,
  RemoteError
} from './protocol.js'
import sendCall from './send-call.js'
import sendNotification from './send-notification.js'
import type {
  AbortSignalLike,
  EventTransport,
  Id,
  Params,
  Response
} from './prelude.js'

export interface CallOptions {
  readonly timeout?: number
  readonly signal?: AbortSignalLike
}

export interface ClientOptions {
  readonly timeout?: number
  readonly nextId?: () => Exclude<Id, null>
  readonly onUnknownResponse?: (response: unknown) => void
  readonly exception?: (error: unknown) => void
}

interface Pending {
  resolve(value: unknown): void
  reject(error: unknown): void
  timer?: ReturnType<typeof setTimeout>
  signal?: AbortSignalLike
  abort?: () => void
}

export class TimeoutError extends Error {
  constructor(public readonly id: Id, timeout: number) {
    super(`JSON-RPC call ${String(id)} timed out after ${timeout} ms.`)
    this.name = 'TimeoutError'
  }
}

export class AbortError extends Error {
  constructor(public readonly id: Id) {
    super(`JSON-RPC call ${String(id)} was aborted.`)
    this.name = 'AbortError'
  }
}

export class TransportClosedError extends Error {
  constructor() {
    super('JSON-RPC transport closed.')
    this.name = 'TransportClosedError'
  }
}

export default class Client {
  #nextNumber = 1
  #pending = new Map<Id, Pending>()
  #closed = false

  readonly #messageListener = (payload?: unknown) => {
    void this.receive(payload).catch(error => {
      this.#options.exception?.(error)
    })
  }

  readonly #closeListener = (reason?: unknown) => {
    this.close(reason instanceof Error ? reason : new TransportClosedError())
  }

  readonly #errorListener = (error?: unknown) => {
    this.close(error instanceof Error ? error : new TransportClosedError())
  }

  constructor(
    readonly transport: EventTransport,
    readonly #options: ClientOptions = {}
  ) {
    transport.on('message', this.#messageListener)
    transport.on('close', this.#closeListener)
    transport.on('error', this.#errorListener)
  }

  get pendingCount() {
    return this.#pending.size
  }

  #removeListener(event: 'message' | 'close' | 'error', listener: (value?: unknown) => void) {
    if (this.transport.off) {
      this.transport.off(event, listener)
    } else {
      this.transport.removeListener?.(event, listener)
    }
  }

  #allocateId(): Exclude<Id, null> {
    for (;;) {
      const id = this.#options.nextId?.() ?? this.#nextNumber++
      if (id === null) {
        throw new TypeError('JSON-RPC client IDs cannot be null.')
      }
      if (!this.#pending.has(id)) {
        return id
      }
    }
  }

  #take(id: Id) {
    const pending = this.#pending.get(id)
    if (!pending) {
      return
    }
    this.#pending.delete(id)
    clearTimeout(pending.timer)
    if (pending.signal && pending.abort) {
      pending.signal.removeEventListener('abort', pending.abort)
    }
    return pending
  }

  #reject(id: Id, error: unknown) {
    this.#take(id)?.reject(error)
  }

  #handleResponse(response: Response) {
    const pending = this.#take(response.id)
    if (!pending) {
      this.#options.onUnknownResponse?.(response)
      return
    }

    if (isErrorResponse(response)) {
      pending.reject(new RemoteError(response.id, response.error))
    } else {
      pending.resolve(response.result)
    }
  }

  async receive(payload: unknown) {
    const value = JSON.parse(payloadText(payload))
    const messages = Array.isArray(value) ? value : [ value ]

    for (const message of messages) {
      if (isSuccessResponse(message) || isErrorResponse(message)) {
        this.#handleResponse(message)
      } else {
        this.#options.onUnknownResponse?.(message)
      }
    }
  }

  call<R = unknown>(
    method: string,
    params?: Params,
    options: CallOptions = {}
  ): Promise<R> {
    if (this.#closed) {
      return Promise.reject(new TransportClosedError())
    }

    const timeout = options.timeout ?? this.#options.timeout
    if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
      return Promise.reject(new RangeError('timeout must be a non-negative finite number.'))
    }
    if (options.signal?.aborted) {
      return Promise.reject(options.signal.reason ?? new AbortError(null))
    }

    const id = this.#allocateId()
    const promise = new Promise<R>((resolve, reject) => {
      const pending: Pending = {
        resolve: value => { resolve(value as R) },
        reject
      }

      if (timeout !== undefined) {
        pending.timer = setTimeout(() => {
          this.#reject(id, new TimeoutError(id, timeout))
        }, timeout)
      }

      if (options.signal) {
        pending.signal = options.signal
        pending.abort = () => {
          this.#reject(id, options.signal?.reason ?? new AbortError(id))
        }
        options.signal.addEventListener('abort', pending.abort, { once: true })
      }

      this.#pending.set(id, pending)
    })

    void sendCall(this.transport, id, method, params).catch(error => {
      this.#reject(id, error)
    })

    return promise
  }

  notify(method: string, params?: Params) {
    if (this.#closed) {
      return Promise.reject(new TransportClosedError())
    }
    return sendNotification(this.transport, method, params)
  }

  close(reason: unknown = new TransportClosedError()) {
    if (this.#closed) {
      return
    }
    this.#closed = true
    for (const id of [ ...this.#pending.keys() ]) {
      this.#reject(id, reason)
    }
  }

  dispose(reason: unknown = new TransportClosedError()) {
    this.close(reason)
    this.#removeListener('message', this.#messageListener)
    this.#removeListener('close', this.#closeListener)
    this.#removeListener('error', this.#errorListener)
  }
}
