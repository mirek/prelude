import type {
  ErrorObject,
  ErrorResponse,
  HandleOptions,
  Id,
  Notification,
  Params,
  Request,
  Response,
  SuccessResponse
} from './prelude.js'

export const ErrorCode = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internalError: -32603
} as const

const errorMessages = new Map<number, string>([
  [ ErrorCode.parseError, 'Parse error' ],
  [ ErrorCode.invalidRequest, 'Invalid Request' ],
  [ ErrorCode.methodNotFound, 'Method not found' ],
  [ ErrorCode.invalidParams, 'Invalid params' ],
  [ ErrorCode.internalError, 'Internal error' ]
])

export class JsonRpcError extends Error {
  constructor(
    public readonly code: number,
    message = errorMessages.get(code) ?? 'JSON-RPC error',
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'JsonRpcError'
  }
}

export class RemoteError extends JsonRpcError {
  constructor(
    public readonly id: Id,
    error: ErrorObject
  ) {
    super(error.code, error.message, error.data)
    this.name = 'RemoteError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function has(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

export function isId(value: unknown): value is Id {
  return value === null ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value))
}

export function isParams(value: unknown): value is Params {
  return Array.isArray(value) || isRecord(value)
}

function hasValidParams(value: Record<string, unknown>) {
  return !has(value, 'params') || isParams(value.params)
}

export function isRequest(value: unknown): value is Request {
  return isRecord(value) &&
    value.jsonrpc === '2.0' &&
    typeof value.method === 'string' &&
    has(value, 'id') &&
    isId(value.id) &&
    hasValidParams(value)
}

export function isNotification(value: unknown): value is Notification {
  return isRecord(value) &&
    value.jsonrpc === '2.0' &&
    typeof value.method === 'string' &&
    !has(value, 'id') &&
    hasValidParams(value)
}

export function isErrorObject(value: unknown): value is ErrorObject {
  return isRecord(value) &&
    typeof value.code === 'number' &&
    Number.isFinite(value.code) &&
    typeof value.message === 'string'
}

export function isSuccessResponse(value: unknown): value is SuccessResponse {
  return isRecord(value) &&
    value.jsonrpc === '2.0' &&
    has(value, 'id') &&
    isId(value.id) &&
    has(value, 'result') &&
    !has(value, 'error')
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return isRecord(value) &&
    value.jsonrpc === '2.0' &&
    has(value, 'id') &&
    isId(value.id) &&
    !has(value, 'result') &&
    isErrorObject(value.error)
}

export function errorObject(error: unknown): ErrorObject {
  if (error instanceof JsonRpcError) {
    return error.data === undefined ?
      { code: error.code, message: error.message } :
      { code: error.code, message: error.message, data: error.data }
  }
  if (isErrorObject(error)) {
    return error.data === undefined ?
      { code: error.code, message: error.message } :
      { code: error.code, message: error.message, data: error.data }
  }
  return error instanceof Error ?
    { code: ErrorCode.internalError, message: 'Internal error', data: error.message } :
    { code: ErrorCode.internalError, message: 'Internal error' }
}

export function errorResponse(id: Id, error: unknown): ErrorResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: errorObject(error)
  }
}

export function standardError(
  code: number,
  id: Id = null,
  data?: unknown
): ErrorResponse {
  return errorResponse(id, new JsonRpcError(code, errorMessages.get(code), data))
}

async function processRequest(request: Request, options: HandleOptions): Promise<Response> {
  if (!options.call) {
    return standardError(ErrorCode.methodNotFound, request.id)
  }

  try {
    const result = await options.call(request.method, request.params, request)
    return { jsonrpc: '2.0', id: request.id, result }
  } catch (error: unknown) {
    return errorResponse(request.id, error)
  }
}

async function processNotification(notification: Notification, options: HandleOptions) {
  if (!options.notification) {
    return
  }
  try {
    await options.notification(notification.method, notification.params, notification)
  } catch (error: unknown) {
    options.exception?.(error)
  }
}

async function processElement(value: unknown, options: HandleOptions): Promise<Response | undefined> {
  if (isRequest(value)) {
    return processRequest(value, options)
  }
  if (isNotification(value)) {
    await processNotification(value, options)
    return
  }
  if (isSuccessResponse(value)) {
    await options.result?.(value.id, value.result)
    return
  }
  if (isErrorResponse(value)) {
    await options.error?.(value.id, value.error)
    return
  }
  return standardError(ErrorCode.invalidRequest)
}

/** Processes an already-parsed JSON-RPC value. */
export async function processMessage(
  value: unknown,
  options: HandleOptions = {}
): Promise<Response | Response[] | undefined> {
  if (!Array.isArray(value)) {
    return processElement(value, options)
  }
  if (value.length === 0) {
    return standardError(ErrorCode.invalidRequest)
  }

  const responses = (await Promise.all(
    value.map(element => processElement(element, options))
  )).filter((response): response is Response => response !== undefined)

  return responses.length === 0 ? undefined : responses
}
