import sendJson from './send-json.js'
import type { Notification, Params, Sendable } from './prelude.js'

const sendNotification =
  (transport: Sendable, method: string, params?: Params): Promise<void> => {
    const notification: Notification = params === undefined ?
      { jsonrpc: '2.0', method } :
      { jsonrpc: '2.0', method, params }
    return sendJson(transport, notification)
  }

export default sendNotification
