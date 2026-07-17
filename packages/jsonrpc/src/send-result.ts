import type { Id, Sendable, SuccessResponse } from './prelude.js'
import sendJson from './send-json.js'

const sendResult =
  (transport: Sendable, id: Id, result: unknown): Promise<void> => {
    const response: SuccessResponse = {
      jsonrpc: '2.0',
      id,
      result: result === undefined ? null : result
    }
    return sendJson(transport, response)
  }

export default sendResult
