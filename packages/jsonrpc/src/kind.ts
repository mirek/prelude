import {
  isErrorResponse,
  isNotification,
  isRequest,
  isSuccessResponse
} from './protocol.js'

const kind =
  (message: unknown): undefined | 'call' | 'result' | 'error' | 'notification' => {
    if (isRequest(message)) {
      return 'call'
    }
    if (isNotification(message)) {
      return 'notification'
    }
    if (isSuccessResponse(message)) {
      return 'result'
    }
    if (isErrorResponse(message)) {
      return 'error'
    }
    return undefined
  }

export default kind
