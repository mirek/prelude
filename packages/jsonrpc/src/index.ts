import Client from './client.js'
import handle, { handlePayload } from './handle.js'
import kind from './kind.js'
import payloadText from './payload.js'
import {
  ErrorCode,
  JsonRpcError,
  RemoteError,
  errorObject,
  errorResponse,
  isErrorObject,
  isErrorResponse,
  isId,
  isNotification,
  isParams,
  isRequest,
  isSuccessResponse,
  processMessage,
  processMessageText,
  standardError
} from './protocol.js'
import sendCall from './send-call.js'
import sendError from './send-error.js'
import sendJson from './send-json.js'
import sendNotification from './send-notification.js'
import sendResult from './send-result.js'
import sendString from './send-string.js'

export * from './client.js'
export * from './prelude.js'

export {
  Client,
  ErrorCode,
  JsonRpcError,
  RemoteError,
  errorObject,
  errorResponse,
  handle,
  handlePayload,
  isErrorObject,
  isErrorResponse,
  isId,
  isNotification,
  isParams,
  isRequest,
  isSuccessResponse,
  kind,
  payloadText,
  processMessage,
  processMessageText,
  sendCall,
  sendError,
  sendJson,
  sendNotification,
  sendResult,
  sendString,
  standardError
}
