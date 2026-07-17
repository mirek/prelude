import type { Id, Params, Request, Sendable } from './prelude.js'
import sendJson from './send-json.js'

const sendCall =
  (transport: Sendable, id: Id, method: string, params?: Params): Promise<void> => {
    const request: Request = params === undefined ?
      { jsonrpc: '2.0', id, method } :
      { jsonrpc: '2.0', id, method, params }
    return sendJson(transport, request)
  }

export default sendCall
