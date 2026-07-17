import sendJson from './send-json.js'
import { errorResponse } from './protocol.js'
import type { Id, Sendable } from './prelude.js'

const sendError =
  (transport: Sendable, id: Id, error: unknown): Promise<void> =>
    sendJson(transport, errorResponse(id, error))

export default sendError
