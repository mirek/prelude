export type Id = string | number | null

export type Params =
  | readonly unknown[]
  | { readonly [key: string]: unknown }

export interface Request {
  readonly jsonrpc: '2.0'
  readonly id: Id
  readonly method: string
  readonly params?: Params
}

export interface Notification {
  readonly jsonrpc: '2.0'
  readonly method: string
  readonly params?: Params
}

export interface SuccessResponse<R = unknown> {
  readonly jsonrpc: '2.0'
  readonly id: Id
  readonly result: R
}

export interface ErrorObject {
  readonly code: number
  readonly message: string
  readonly data?: unknown
}

export interface ErrorResponse {
  readonly jsonrpc: '2.0'
  readonly id: Id
  readonly error: ErrorObject
}

export type Response<R = unknown> =
  | SuccessResponse<R>
  | ErrorResponse

export type Message =
  | Request
  | Notification
  | Response

export interface Sendable {
  send(message: string, callback?: (error?: Error) => void): void | Promise<void>
}

export interface EventTransport extends Sendable {
  on(event: 'message' | 'close' | 'error', callback: (value?: unknown) => void): void
  removeListener?(event: 'message' | 'close' | 'error', callback: (value?: unknown) => void): void
  off?(event: 'message' | 'close' | 'error', callback: (value?: unknown) => void): void
}

export interface AbortSignalLike {
  readonly aborted: boolean
  readonly reason?: unknown
  addEventListener(event: 'abort', callback: () => void, options?: { readonly once?: boolean }): void
  removeEventListener(event: 'abort', callback: () => void): void
}

export interface HandleOptions {
  call?: (method: string, params: Params | undefined, request: Request) => unknown | Promise<unknown>
  notification?: (method: string, params: Params | undefined, notification: Notification) => unknown | Promise<unknown>
  result?: (id: Id, result: unknown) => unknown | Promise<unknown>
  error?: (id: Id, error: ErrorObject) => unknown | Promise<unknown>
  exception?: (error: unknown) => unknown
}
